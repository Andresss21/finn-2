import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Tarjeta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { verificarInvariantes } from '../invariantes';
import { hechosArb } from '../pruebas/generadores';
import { presupuesto as seleccionarPresupuesto } from '../selectores/presupuesto';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { calcular } from './calcular';
import { celda, presupuesto } from './disponible';
import { pagosImplicitos } from './por-cobrar';

const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15, ciclo mensual. Abril: `super` gasta 200 en efectivo con 150 asignados (−50);
 * `ropa` gasta 40 con la tarjeta con 100 asignados (traslada 40 a `pago-vi`). Mayo (futuro): 30 más
 * a `super` y −80 a `ropa`. El último período con datos es mayo; junio es la proyección.
 */
function hechos(): Hechos {
  const cat = (n: string, extra: Partial<Categoria> = {}) =>
    ({
      id: id(n),
      grupoId: id('g'),
      nombre: n,
      orden: 1,
      clase: 'normal',
      tarjetaId: null,
      archivada: false,
      ...extra,
    }) as Categoria;
  const asig = (x: string, periodo: string, monto: number) =>
    ({
      id: id(`a-${x}-${periodo}`),
      categoriaId: id(x),
      periodoInicio: f(periodo),
      monto: c(monto),
    }) as Asignacion;
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    cuenta: string,
    monto: number,
    x?: string,
  ) => {
    transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: null,
      total: c(Math.abs(monto)),
      lineaCobradaId: null,
    } as Transaccion);
    efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id(cuenta),
      monto: c(monto),
      interes: null,
      seguro: null,
    } as Efecto);
    if (x !== undefined)
      lineas.push({
        id: id(`l-${tx}`),
        transaccionId: id(tx),
        orden: 1,
        monto: c(Math.abs(monto)),
        categoriaId: id(x),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea);
  };
  mov('si', 'saldo_inicial', '2027-03-01', 'ef', 1000);
  mov('g-super', 'gasto', '2027-04-10', 'ef', -200, 'super');
  mov('g-ropa', 'gasto', '2027-04-12', 'vi', -40, 'ropa');
  const h: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [
      { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
      { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', archivada: false },
    ] as Cuenta[],
    tarjetas: [
      {
        cuentaId: id('vi'),
        tipo: 'tarjeta',
        limiteCredito: c(1000),
        diaCorte: 1,
        diaPago: 17,
      } as Tarjeta,
    ],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('g'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
    ] as Grupo[],
    categorias: [
      cat('super'),
      cat('ropa', { orden: 2 }),
      cat('pago-vi', { clase: 'pago', tarjetaId: id('vi') }),
    ],
    asignaciones: [
      asig('super', '2027-04-01', 150),
      asig('ropa', '2027-04-01', 100),
      asig('super', '2027-05-01', 30),
      asig('ropa', '2027-05-01', -80),
    ],
    deudores: [],
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
  return h;
}

const HOY = f('2027-04-15');

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-111 [INV-17] MOT-4.6: el período siguiente al último con datos sale de la instantánea con Arr = máx(0, último Disp) y Asig = Act = 0; el presupuesto de ese período no lanza', () => {
    const i = calcular(hechos(), HOY);
    const b = i.presupuesto;
    expect(b.periodos.map((p) => p.inicio)).toEqual([
      '2027-03-01',
      '2027-04-01',
      '2027-05-01',
      '2027-06-01',
    ]);
    const fila = (x: string, mes: string) => {
      const y = celda(b, id(x), f(`2027-${mes}-01`));
      return [y.estado, y.arrastre, y.asignado, y.actividad, y.disponible, y.sobT, y.sobD];
    };
    // [estado, Arr, Asig, Act, Disp, SobT, SobD]. Mayo es el último con datos (sus asignaciones); el
    // −20 de `ropa` es sobregiro de débito (§4.7: N = 20 sin parte de tarjeta).
    expect(fila('super', '05')).toEqual(['futuro', 0, c(30), 0, c(30), 0, 0]);
    expect(fila('ropa', '05')).toEqual(['futuro', c(60), c(-80), 0, c(-20), 0, c(20)]);
    expect(fila('pago-vi', '05')).toEqual(['futuro', c(40), 0, 0, c(40), 0, 0]);
    // Junio, la proyección: Arr = máx(0, Disp de mayo), Asig = Act = 0.
    expect(fila('super', '06')).toEqual(['futuro', c(30), 0, 0, c(30), 0, 0]);
    expect(fila('ropa', '06')).toEqual(['futuro', 0, 0, 0, 0, 0, 0]);
    expect(fila('pago-vi', '06')).toEqual(['futuro', c(40), 0, 0, c(40), 0, 0]);
    expect(verificarInvariantes(i)).toEqual([]);

    // El selector lee junio de la instantánea; solo el período posterior a la proyección queda fuera.
    const junio = seleccionarPresupuesto(i, f('2027-06-01'));
    expect(junio.periodo.estado).toBe('futuro');
    expect(junio.navegacion).toEqual({ anterior: f('2027-05-01'), siguiente: f('2027-07-01') });
    expect(junio.grupos[0]?.categorias.map((x) => [x.categoria.id, x.disponible])).toEqual([
      ['super', c(30)],
      ['ropa', 0],
    ]);
    expect(junio.pagosTarjeta[0]).toMatchObject({ disponible: c(40), faltaReservar: 0 });
    expect(junio.totales).toEqual({ asignado: 0, gastado: 0, disponible: c(70) });
    expect(() => seleccionarPresupuesto(i, f('2027-07-01'))).toThrow(RangeError);

    // Sin asignaciones futuras, el último con datos es el activo y la proyección es mayo.
    const sinFuturas = { ...hechos(), asignaciones: hechos().asignaciones.slice(0, 2) };
    const solo = calcular(sinFuturas, HOY).presupuesto;
    expect(solo.periodos.map((p) => p.inicio)).toEqual(['2027-03-01', '2027-04-01', '2027-05-01']);
    expect(celda(solo, id('super'), f('2027-05-01')).arrastre).toBe(0);
    expect(celda(solo, id('ropa'), f('2027-05-01')).disponible).toBe(c(60));
  });

  it('PRU-DOM-MOTOR-111 [INV-17] la proyección agrega un solo período, con actividad cero, sin cambiar los derivados de los demás ni romper invariantes', () => {
    fc.assert(
      fc.property(hechosArb(f('2027-12-31')), (x) => {
        const hoy = f('2027-12-31');
        const i = calcular(x, hoy);
        const b = i.presupuesto;
        const sin = presupuesto(i.hechos, i.ciclo, hoy, pagosImplicitos(i.porCobrar));
        const ultimo = b.periodos[b.periodos.length - 1];
        expect(b.periodos.slice(0, -1)).toEqual(sin.periodos);
        expect(ultimo?.inicio).toBe(
          FechaLocal.sumarDias(sin.periodos[sin.periodos.length - 1]?.fin ?? hoy, 1),
        );
        const proyectadas = b.celdas.filter((y) => y.periodo.inicio === ultimo?.inicio);
        expect(b.celdas.slice(0, b.celdas.length - proyectadas.length)).toEqual(sin.celdas);
        expect(b.repartos.filter((r) => r.periodo.inicio !== ultimo?.inicio)).toEqual(sin.repartos);
        for (const y of proyectadas) {
          const previa = celda(
            sin,
            y.categoriaId,
            sin.periodos[sin.periodos.length - 1]?.inicio ?? hoy,
          );
          expect([y.estado, y.asignado, y.actividad, y.sobT, y.sobD]).toEqual([
            'futuro',
            0,
            0,
            0,
            0,
          ]);
          expect(y.arrastre).toBe(Centavos.max(Centavos.cero, previa.disponible));
          expect(y.disponible).toBe(y.arrastre);
        }
        expect(verificarInvariantes(i)).toEqual([]);
      }),
      opciones,
    );
  });
});
