import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Tarjeta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { FILAS_DE_FLUJO, flujoEfectivo } from './flujo-efectivo';

// 300 casos en PR (07 §1.1); FC_RUNS=5000 en el nocturno (V6-03). La semilla la fija vitest.config.ts.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const id = (t: string) => t as Uuid;
const HOY = FechaLocal.desdeTexto('2027-04-15');
const INICIO = FechaLocal.desdeTexto('2027-01-01');

/** Los tipos con efecto en una cuenta de efectivo (3.3) y la otra pata que tienen. */
type Tipo = Extract<
  TipoTransaccion,
  | 'saldo_inicial'
  | 'ingreso'
  | 'cobro'
  | 'devolucion'
  | 'desembolso_prestamo'
  | 'retiro_inversion'
  | 'avance_efectivo'
  | 'gasto'
  | 'pago_tarjeta'
  | 'cuota_prestamo'
  | 'abono_capital'
  | 'aporte_inversion'
  | 'transferencia'
>;
const TIPOS: readonly Tipo[] = [
  'saldo_inicial',
  'ingreso',
  'cobro',
  'devolucion',
  'desembolso_prestamo',
  'retiro_inversion',
  'avance_efectivo',
  'gasto',
  'pago_tarjeta',
  'cuota_prestamo',
  'abono_capital',
  'aporte_inversion',
  'transferencia',
];
/** Con qué cuenta se cruza el efectivo en cada tipo (`null`: solo toca efectivo). */
const OTRA: Partial<Record<Tipo, { cuenta: string; signo: 1 | -1 }>> = {
  desembolso_prestamo: { cuenta: 'pr', signo: -1 },
  retiro_inversion: { cuenta: 'inv', signo: -1 },
  avance_efectivo: { cuenta: 'tj', signo: -1 },
  pago_tarjeta: { cuenta: 'tj', signo: 1 },
  cuota_prestamo: { cuenta: 'pr', signo: 1 },
  abono_capital: { cuenta: 'pr', signo: 1 },
  aporte_inversion: { cuenta: 'inv', signo: 1 },
};
/** Las que dejan salir dinero del efectivo. */
const SALIDAS: readonly Tipo[] = [
  'gasto',
  'pago_tarjeta',
  'cuota_prestamo',
  'abono_capital',
  'aporte_inversion',
];

interface Plan {
  readonly tipo: Tipo;
  readonly dia: number;
  readonly cuenta: number;
  readonly destino: number;
  readonly monto: number;
  readonly porCobrar: number;
  readonly cobro: number;
}

const plan = fc.record({
  tipo: fc.constantFrom(...TIPOS),
  dia: fc.integer({ min: 0, max: FechaLocal.diasEntre(INICIO, HOY) }),
  cuenta: fc.nat(1000),
  destino: fc.nat(1000),
  monto: fc.integer({ min: 1, max: 50_000 }),
  porCobrar: fc.integer({ min: 0, max: 50_000 }),
  cobro: fc.integer({ min: 1, max: 100_000 }),
});

const caso = fc.record({
  efectivo: fc.integer({ min: 1, max: 3 }),
  archivada: fc.boolean(),
  planes: fc.array(plan, { maxLength: 40 }),
  filtro: fc.array(fc.nat(1000), { maxLength: 3 }),
});

function construir(c: { efectivo: number; archivada: boolean; planes: readonly Plan[] }): Hechos {
  const cuentas = [
    ...Array.from({ length: c.efectivo }, (_, k) => ({
      id: id(`ef${k}`),
      tipo: 'efectivo',
      nombre: `Efectivo ${k}`,
      fechaApertura: INICIO,
      archivada: c.archivada && k === c.efectivo - 1 && c.efectivo > 1,
    })),
    ...(['tj', 'pr', 'inv'] as const).map((k) => ({
      id: id(k),
      tipo: k === 'tj' ? 'tarjeta' : k === 'pr' ? 'prestamo' : 'inversion',
      nombre: k,
      fechaApertura: INICIO,
      archivada: false,
    })),
  ] as unknown as Cuenta[];
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const tx = (
    n: string,
    tipo: TipoTransaccion,
    fecha: FechaLocal,
    total: number,
    extra: Partial<Transaccion> = {},
  ) =>
    transacciones.push({
      id: id(n),
      tipo,
      fecha,
      claveOrden: `${fecha}T12:00:00.${String(transacciones.length).padStart(3, '0')}Z`,
      secuencia: String(transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: null,
      total: Centavos.desdeEntero(total),
      lineaCobradaId: null,
      ...extra,
    } as Transaccion);
  const efecto = (n: string, cuenta: string, monto: number) =>
    efectos.push({
      id: id(`e-${n}-${cuenta}-${efectos.length}`),
      transaccionId: id(n),
      cuentaId: id(cuenta),
      monto: Centavos.desdeEntero(monto),
      interes: null,
      seguro: null,
    } as Efecto);
  const linea = (
    n: string,
    orden: number,
    monto: number,
    categoria: string | null,
    deudor: string | null,
  ) =>
    lineas.push({
      id: id(`l-${n}-${orden}`),
      transaccionId: id(n),
      orden,
      monto: Centavos.desdeEntero(monto),
      categoriaId: categoria === null ? null : id(categoria),
      deudorId: deudor === null ? null : id(deudor),
      lineaOriginalId: null,
    } as Linea);

  // Un saldo inicial grande en cada cuenta de efectivo, el primer día.
  for (let k = 0; k < c.efectivo; k++) {
    tx(`si${k}`, 'saldo_inicial', INICIO, 1_000_000);
    efecto(`si${k}`, `ef${k}`, 1_000_000);
  }
  c.planes.forEach((p, n) => {
    const fecha = FechaLocal.sumarDias(INICIO, p.dia);
    const ef = `ef${p.cuenta % c.efectivo}`;
    const nombre = `t${n}`;
    const saliente = SALIDAS.includes(p.tipo);
    switch (p.tipo) {
      case 'gasto': {
        const cobrar = Math.min(p.porCobrar, p.monto);
        tx(nombre, 'gasto', fecha, p.monto);
        efecto(nombre, ef, -p.monto);
        if (p.monto > cobrar) linea(nombre, 1, p.monto - cobrar, 'c1', null);
        if (cobrar > 0) linea(nombre, 2, cobrar, null, 'd1');
        break;
      }
      case 'cobro': {
        // Un gasto previo con una línea por cobrar y su cobro, que puede dejar excedente.
        tx(`${nombre}-g`, 'gasto', fecha, p.monto);
        efecto(`${nombre}-g`, ef, -p.monto);
        linea(`${nombre}-g`, 1, p.monto, null, 'd1');
        tx(nombre, 'cobro', fecha, p.cobro, { lineaCobradaId: id(`l-${nombre}-g-1`) });
        efecto(nombre, ef, p.cobro);
        break;
      }
      case 'devolucion':
        tx(nombre, 'devolucion', fecha, p.monto);
        efecto(nombre, ef, p.monto);
        linea(nombre, 1, p.monto, 'c1', null);
        break;
      case 'transferencia': {
        const otro = `ef${p.destino % c.efectivo}`;
        tx(nombre, 'transferencia', fecha, p.monto);
        efecto(nombre, ef, -p.monto);
        efecto(nombre, otro, p.monto);
        break;
      }
      case 'saldo_inicial':
        // Una cuenta que se abre con saldo a favor o en contra: solo el efecto en efectivo.
        tx(nombre, 'saldo_inicial', fecha, p.monto);
        efecto(nombre, ef, p.destino % 2 === 0 ? p.monto : -p.monto);
        break;
      default: {
        tx(nombre, p.tipo, fecha, p.monto);
        efecto(nombre, ef, saliente ? -p.monto : p.monto);
        const otra = OTRA[p.tipo];
        if (otra !== undefined) efecto(nombre, otra.cuenta, otra.signo * p.monto);
      }
    }
  });

  return {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas,
    tarjetas: [
      {
        cuentaId: id('tj'),
        tipo: 'tarjeta',
        limiteCredito: Centavos.desdeEntero(10_000_000),
        diaCorte: 1,
        diaPago: 17,
      },
    ] as unknown as Tarjeta[],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      { id: id('gp'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
    ] as Grupo[],
    categorias: [
      {
        id: id('c1'),
        grupoId: id('g'),
        nombre: 'c1',
        orden: 1,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      },
      {
        id: id('pago-tj'),
        grupoId: id('gp'),
        nombre: 'Pago tj',
        orden: 1,
        clase: 'pago',
        tarjetaId: id('tj'),
        archivada: false,
      },
    ] as unknown as Hechos['categorias'],
    asignaciones: [],
    deudores: [{ id: id('d1'), nombre: 'Deudor' }] as unknown as Hechos['deudores'],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

const suma = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

describe('PRU-PROP-REP', () => {
  it('PRU-PROP-REP-003 [V6-03] REP-flujo_efectivo (CF-02) flujo de efectivo: saldo inicial + Σ filas = saldo final, cada tipo cae en una sola fila y las transferencias entre cuentas de K se anulan', () => {
    fc.assert(
      fc.property(caso, (c) => {
        const i = calcular(construir(c), HOY);
        const efectivo = [...Array.from({ length: c.efectivo }, (_, k) => `ef${k}`)];
        const filtro = [...new Set(c.filtro.map((n) => efectivo[n % efectivo.length] as string))];
        for (const cuentaIds of [undefined, filtro.map(id)]) {
          for (const ventana of ['actual', 'ultimos_3'] as const) {
            const r = flujoEfectivo(i, {
              ventana,
              ...(cuentaIds === undefined ? {} : { cuentaIds }),
            });
            for (const p of r.periodos) {
              const filas = p.filas.map((x) => x.monto as number);
              expect(p.saldoInicial + suma(filas)).toBe(p.saldoFinal);
              expect(new Set(p.filas.map((x) => x.fila)).size).toBe(p.filas.length);
              expect(p.filas.every((x) => FILAS_DE_FLUJO.includes(x.fila))).toBe(true);
              // Sin filtro, las dos patas de una transferencia están en K y se anulan.
              if (
                cuentaIds === undefined ||
                filtro.length === 0 ||
                filtro.length === efectivo.length
              )
                expect(p.filas.some((x) => x.fila === 'transferencias')).toBe(false);
              // Las salidas nunca suman y las entradas nunca restan (salvo saldos iniciales).
              for (const x of p.filas) {
                if (
                  [
                    'gastos_debito',
                    'por_cobrar_debito',
                    'pagos_tarjeta',
                    'prestamos_inversiones',
                  ].includes(x.fila)
                )
                  expect(x.monto).toBeLessThanOrEqual(0);
                if (
                  ['ingresos', 'restituciones', 'devoluciones', 'otras_entradas'].includes(x.fila)
                )
                  expect(x.monto).toBeGreaterThanOrEqual(0);
              }
            }
          }
        }
      }),
      opciones,
    );
  });
});
