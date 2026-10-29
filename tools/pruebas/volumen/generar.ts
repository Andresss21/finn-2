// Volumen sintético (07 §12.7, BE-23): `node tools/pruebas/volumen/generar.ts --nivel base|alto --anios 10 --semilla N`.
// Produce, de forma determinista (la misma semilla da los mismos hechos), el volumen de 02 §2.2: unas 70.000 filas
// de entrada del motor (base, 2.000 transacciones al año) o unas 190.000 (alto, 5.000 al año) a los 10 años, con 2
// tarjetas, 40 categorías (38 normales y las 2 de pago) y frecuencias de uso desiguales.
// Dos salidas: `generarHechos` (los `Hechos` en memoria, para `calcular`) y `generarPeriodos` (las mismas filas por
// período del ciclo, con la fecha que tiene que fijar `finn.hoy` al cargar cada una: el fin del período; así pasan
// los triggers igual que en la app, 07 §12.7). Sin reloj de pared ni azar propio: solo la semilla. Solo importa
// tipos del dominio: Node 24 corre este archivo sin transformar.
import type {
  BigintTexto,
  FilasPorTabla,
  Hechos,
  Instante,
  TablaMotor,
  Uuid,
} from '../../../packages/dominio/src/hechos/index.ts';
import type { Centavos } from '../../../packages/dominio/src/valores/centavos.ts';
import type { FechaLocal } from '../../../packages/dominio/src/valores/fecha-local.ts';

export type Nivel = 'base' | 'alto';
export interface OpcionesVolumen {
  readonly nivel: Nivel;
  readonly anios: number;
  readonly semilla: number;
  /**
   * El grupo "Pagos de tarjeta" y la vigencia del ciclo los siembra la migración (03 §9). Con este id la carga es
   * contra una base: la salida usa ese grupo y no incluye ni el grupo ni la vigencia.
   */
  readonly grupoPagos?: Uuid;
}
/** Filas por tabla [M]. */
export type FilasMotor = { [T in TablaMotor]: FilasPorTabla[T][] };
export interface PeriodoVolumen {
  readonly inicio: FechaLocal;
  /** Fin del período: el valor de `finn.hoy` al cargarlo. */
  readonly hoy: FechaLocal;
  readonly filas: FilasMotor;
}

/** 02 §2.2: transacciones por año de cada nivel. */
export const TRANSACCIONES_POR_ANIO: Readonly<Record<Nivel, number>> = { base: 2000, alto: 5000 };
export const TABLAS_MOTOR: readonly TablaMotor[] = [
  'vigencias_ciclo',
  'cuentas',
  'tarjetas',
  'prestamos',
  'inversiones',
  'grupos',
  'categorias',
  'asignaciones',
  'deudores',
  'transacciones',
  'efectos',
  'lineas',
  'condonaciones',
  'metas',
  'programadas',
  'programada_lineas',
  'ocurrencias_resueltas',
  'conciliaciones',
];

const PRIMER_INICIO = { anio: 2027, mes: 1 }; // el período de ciclo 21 empieza el 21 de enero de 2027
const DIA_CICLO = 21;
const DIA_MS = 86_400_000;

// ───────────── fechas (aritmética civil sobre UTC: sin reloj) ─────────────
const dos = (n: number): string => String(n).padStart(2, '0');
const fechaDe = (anio: number, mes: number, dia: number): FechaLocal =>
  `${anio}-${dos(mes)}-${dos(dia)}` as FechaLocal;
const mesDesplazado = (k: number): { anio: number; mes: number } => {
  const total = PRIMER_INICIO.anio * 12 + (PRIMER_INICIO.mes - 1) + k;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
};
const inicioDelPeriodo = (k: number): FechaLocal => {
  const { anio, mes } = mesDesplazado(k);
  return fechaDe(anio, mes, DIA_CICLO);
};
const finDelPeriodo = (k: number): FechaLocal => {
  const { anio, mes } = mesDesplazado(k + 1);
  return fechaDe(anio, mes, DIA_CICLO - 1);
};
const ms = (f: string): number => Date.parse(`${f}T00:00:00Z`);
const mas = (f: string, dias: number): FechaLocal =>
  new Date(ms(f) + dias * DIA_MS).toISOString().slice(0, 10) as FechaLocal;

// ───────────── azar con semilla (mulberry32) ─────────────
function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────── identificadores: UUID por tabla y contador ─────────────
const CODIGO: Readonly<Record<string, number>> = {
  vig: 1,
  cta: 2,
  grp: 3,
  cat: 4,
  asg: 5,
  deu: 6,
  trx: 7,
  efe: 8,
  lin: 9,
  met: 10,
  prg: 11,
  prl: 12,
};
const id = (tabla: keyof typeof CODIGO, n: number): Uuid =>
  `${(CODIGO[tabla] ?? 0).toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}` as Uuid;
const cents = (n: number): Centavos => n as Centavos;
const instante = (fecha: string, n: number): Instante => {
  const seg = (n * 7919) % 86_400;
  const hh = dos(Math.floor(seg / 3600));
  const mm = dos(Math.floor((seg % 3600) / 60));
  const ss = dos(seg % 60);
  return `${fecha}T${hh}:${mm}:${ss}.${String(n % 1000).padStart(3, '0')}Z` as Instante;
};

// ───────────── catálogo: 38 categorías normales en 6 grupos ─────────────
const GRUPOS: readonly (readonly [string, readonly string[]])[] = [
  [
    'Hogar',
    ['Alquiler', 'Luz y agua', 'Internet', 'Teléfono', 'Mantenimiento', 'Muebles', 'Limpieza'],
  ],
  [
    'Alimentación',
    ['Supermercado', 'Restaurantes', 'Café', 'Panadería', 'Comida rápida', 'Mercado'],
  ],
  ['Transporte', ['Gasolina', 'Parqueo', 'Taller', 'Seguro del auto', 'Taxi', 'Peaje']],
  ['Ocio', ['Netflix', 'Spotify', 'Cine', 'Viajes', 'Libros', 'Juegos', 'Deportes', 'Regalos']],
  ['Personal', ['Farmacia', 'Médico', 'Ropa', 'Peluquería', 'Educación', 'Mascota', 'Donaciones']],
  ['Finanzas', ['Comisiones', 'Impuestos', 'Seguros', 'Ahorro']],
];
const PROGRAMADAS = [
  ['Netflix', 1500, 'Netflix'],
  ['Spotify', 600, 'Spotify'],
  ['Internet', 3500, 'Internet'],
] as const;

/** Las categorías se usan con frecuencias desiguales: peso 1 / (posición + 1)^0.8. */
function pesosAcumulados(n: number): number[] {
  let suma = 0;
  return Array.from({ length: n }, (_, i) => (suma += 1 / (i + 1) ** 0.8));
}

function vacio(): FilasMotor {
  return Object.fromEntries(TABLAS_MOTOR.map((t) => [t, []])) as unknown as FilasMotor;
}

/** Los períodos del volumen, de enero de 2027 en adelante, `anios × 12` en total. */
export function generarPeriodos(op: OpcionesVolumen): PeriodoVolumen[] {
  const rng = azar(op.semilla);
  const total = Math.round(TRANSACCIONES_POR_ANIO[op.nivel] * op.anios);
  const nPeriodos = Math.round(op.anios * 12);
  const inicio0 = inicioDelPeriodo(0);
  const grupoPagos = op.grupoPagos ?? id('grp', 0);

  // Catálogo fijo
  const cuentas = {
    efectivo: id('cta', 1),
    ahorros: id('cta', 2),
    visa: id('cta', 3),
    master: id('cta', 4),
  };
  const deudores = [id('deu', 1), id('deu', 2)];
  const grupos = GRUPOS.map(([nombre], i) => ({ id: id('grp', i + 1), nombre }));
  const normales = GRUPOS.flatMap(([, nombres], g) =>
    nombres.map((nombre) => ({ nombre, grupoId: grupos[g]?.id as Uuid })),
  ).map((c, i) => ({ ...c, id: id('cat', i + 1), orden: i }));
  const pagoVisa = id('cat', 100);
  const pagoMaster = id('cat', 101);
  const acumulado = pesosAcumulados(normales.length);
  const elegirCategoria = (): Uuid => {
    const x = rng() * (acumulado[acumulado.length - 1] ?? 1);
    const i = acumulado.findIndex((a) => x <= a);
    return (normales[i < 0 ? 0 : i] as { id: Uuid }).id;
  };
  const baseAsignacion = normales.map((_, i) => 3000 + Math.round(40_000 / (i + 1) ** 0.8));
  const deuda: Record<string, number> = { [cuentas.visa]: 0, [cuentas.master]: 0 };

  let nTx = 0,
    nEf = 0,
    nLin = 0,
    nAsg = 0,
    secuencia = 0;

  const periodos: PeriodoVolumen[] = [];
  for (let k = 0; k < nPeriodos; k++) {
    const inicio = inicioDelPeriodo(k);
    const hoy = finDelPeriodo(k);
    const dias = Math.round((ms(hoy) - ms(inicio)) / DIA_MS) + 1;
    const f = vacio();

    if (k === 0) {
      if (op.grupoPagos === undefined) {
        f.vigencias_ciclo.push({
          id: id('vig', 1),
          diaInicio: DIA_CICLO,
          rigeDesde: null,
          revision: null,
        });
        f.grupos.push({
          id: grupoPagos,
          nombre: 'Pagos de tarjeta',
          orden: 0,
          archivado: false,
          claveSistema: 'pagos_tarjeta',
          revision: null,
        });
      }
      const cuenta = (cid: Uuid, tipo: 'efectivo' | 'tarjeta', nombre: string, orden: number) =>
        f.cuentas.push({
          id: cid,
          tipo,
          nombre,
          institucionId: null,
          ultimos4: null,
          fechaApertura: inicio0,
          orden,
          archivada: false,
          revision: null,
        });
      cuenta(cuentas.efectivo, 'efectivo', 'Efectivo', 0);
      cuenta(cuentas.ahorros, 'efectivo', 'Ahorros', 1);
      cuenta(cuentas.visa, 'tarjeta', 'Visa', 2);
      cuenta(cuentas.master, 'tarjeta', 'Mastercard', 3);
      for (const [cid, red, color] of [
        [cuentas.visa, 'visa', '#1A2B3C'],
        [cuentas.master, 'mastercard', '#3C2B1A'],
      ] as const)
        f.tarjetas.push({
          cuentaId: cid,
          tipo: 'tarjeta',
          limiteCredito: cents(500_000),
          tasaAnualMillonesimas: 240_000,
          diaCorte: 15,
          diaPago: 5,
          red,
          color,
          revision: null,
        });
      grupos.forEach((g, i) =>
        f.grupos.push({
          id: g.id,
          nombre: g.nombre,
          orden: i + 1,
          archivado: false,
          claveSistema: null,
          revision: null,
        }),
      );
      f.categorias.push(
        {
          id: pagoVisa,
          grupoId: grupoPagos,
          nombre: 'Visa',
          orden: 0,
          clase: 'pago',
          tarjetaId: cuentas.visa,
          archivada: false,
          revision: null,
        },
        {
          id: pagoMaster,
          grupoId: grupoPagos,
          nombre: 'Mastercard',
          orden: 1,
          clase: 'pago',
          tarjetaId: cuentas.master,
          archivada: false,
          revision: null,
        },
      );
      for (const c of normales)
        f.categorias.push({
          id: c.id,
          grupoId: c.grupoId,
          nombre: c.nombre,
          orden: c.orden,
          clase: 'normal',
          tarjetaId: null,
          archivada: false,
          revision: null,
        });
      deudores.forEach((d, i) =>
        f.deudores.push({ id: d, nombre: i === 0 ? 'Ana' : 'Luis', revision: null }),
      );
      for (let i = 0; i < 3; i++)
        f.metas.push({
          id: id('met', i + 1),
          categoriaId: (normales[i] as { id: Uuid }).id,
          tipo: 'mensual',
          modo: 'acumular',
          monto: cents(30_000),
          fechaObjetivo: null,
          fechaCreacion: inicio0,
          revision: null,
        });
      // Programadas mensuales que solo corren el último año: pocas ocurrencias pendientes
      const primera = inicioDelPeriodo(Math.max(0, nPeriodos - 12));
      PROGRAMADAS.forEach(([comercio, monto, categoria], i) => {
        const cat = normales.find((c) => c.nombre === categoria) as { id: Uuid };
        f.programadas.push({
          id: id('prg', i + 1),
          tipo: 'gasto',
          cuentaId: cuentas.efectivo,
          cuentaDestinoId: null,
          comercio,
          monto: cents(monto),
          tolerancia: cents(0),
          frecuencia: 'mensual',
          frecuenciaDias: null,
          primeraFecha: primera,
          fechaFin: null,
          registroAutomatico: false,
          activa: true,
          reactivadaDesde: null,
          revision: null,
        });
        f.programada_lineas.push({
          id: id('prl', i + 1),
          programadaId: id('prg', i + 1),
          orden: 1,
          monto: cents(monto),
          categoriaId: cat.id,
          revision: null,
        });
      });
    }

    // Asignaciones del período: una por categoría normal
    normales.forEach((c, i) =>
      f.asignaciones.push({
        id: id('asg', ++nAsg),
        categoriaId: c.id,
        periodoInicio: inicio,
        monto: cents(baseAsignacion[i] as number),
        revision: null,
      }),
    );

    // Transacciones del período (el total se reparte exacto entre los períodos)
    const cantidad =
      Math.floor((total * (k + 1)) / nPeriodos) - Math.floor((total * k) / nPeriodos);
    type Plan = { dia: number; i: number };
    const plan: Plan[] = Array.from({ length: cantidad }, (_, i) => ({
      dia: Math.floor(rng() * dias),
      i,
    }));
    plan.sort((a, b) => a.dia - b.dia || a.i - b.i);

    const nueva = (
      tipo: FilasPorTabla['transacciones']['tipo'],
      fecha: FechaLocal,
      monto: number,
    ) => {
      const n = ++nTx;
      const hora = instante(fecha, n);
      const t = {
        id: id('trx', n),
        tipo,
        fecha,
        horaRegistro: hora,
        claveOrden: hora,
        secuencia: String(++secuencia) as BigintTexto,
        origen: 'manual' as const,
        estadoBancario: 'pendiente' as const,
        conciliacionId: null,
        comercio: null,
        nota: null,
        total: cents(monto),
        monedaOriginal: null,
        montoOriginal: null,
        lineaCobradaId: null,
        revision: null,
      };
      f.transacciones.push(t);
      return t.id;
    };
    const efecto = (trx: Uuid, cuenta: Uuid, monto: number) =>
      f.efectos.push({
        id: id('efe', ++nEf),
        transaccionId: trx,
        cuentaId: cuenta,
        monto: cents(monto),
        interes: null,
        seguro: null,
        revision: null,
      });
    const linea = (
      trx: Uuid,
      orden: number,
      monto: number,
      destino: { categoriaId?: Uuid; deudorId?: Uuid },
    ) =>
      f.lineas.push({
        id: id('lin', ++nLin),
        transaccionId: trx,
        orden,
        monto: cents(monto),
        categoriaId: destino.categoriaId ?? null,
        deudorId: destino.deudorId ?? null,
        lineaOriginalId: null,
        revision: null,
      });

    if (k === 0) {
      for (const [cuenta, monto] of [
        [cuentas.efectivo, 500_000],
        [cuentas.ahorros, 2_000_000],
      ] as const) {
        const t = nueva('saldo_inicial', inicio, monto);
        efecto(t, cuenta, monto);
      }
    }

    for (const { dia } of plan) {
      const fecha = mas(inicio, dia);
      const x = rng();
      const efectivoOAhorros = (): Uuid => (rng() < 0.7 ? cuentas.efectivo : cuentas.ahorros);
      if (
        x < 0.56 ||
        (x < 0.72 && Math.max(deuda[cuentas.visa] as number, deuda[cuentas.master] as number) < 100)
      ) {
        // Gasto con 1 a 3 líneas; 60 % en tarjeta
        const monto = 100 + Math.floor(rng() ** 3 * 20_000);
        const r = rng();
        const cuenta = r < 0.4 ? cuentas.visa : r < 0.6 ? cuentas.master : cuentas.efectivo;
        const t = nueva('gasto', fecha, monto);
        efecto(t, cuenta, -monto);
        if (cuenta !== cuentas.efectivo) deuda[cuenta] = (deuda[cuenta] as number) + monto;
        const q = rng();
        const n = q < 0.45 ? 1 : q < 0.8 ? 2 : 3;
        let resto = monto;
        for (let o = 1; o <= n; o++) {
          const parte = o === n ? resto : Math.floor(monto / n);
          resto -= parte;
          linea(
            t,
            o,
            parte,
            rng() < 0.03
              ? { deudorId: deudores[Math.floor(rng() * 2)] as Uuid }
              : { categoriaId: elegirCategoria() },
          );
        }
      } else if (x < 0.68) {
        const monto = 5_000 + Math.floor(rng() * 40_000);
        const t = nueva('ingreso', fecha, monto);
        efecto(t, efectivoOAhorros(), monto);
      } else if (x < 0.84) {
        // Pago de la tarjeta con más deuda, entre 30 % y 100 % de la deuda
        const visa = (deuda[cuentas.visa] as number) >= (deuda[cuentas.master] as number);
        const tarjeta = visa ? cuentas.visa : cuentas.master;
        const pendiente = deuda[tarjeta] as number;
        const monto = Math.max(
          100,
          Math.min(pendiente, Math.floor(pendiente * (0.3 + 0.7 * rng()))),
        );
        deuda[tarjeta] = Math.max(0, pendiente - monto);
        const t = nueva('pago_tarjeta', fecha, monto);
        efecto(t, efectivoOAhorros(), -monto);
        efecto(t, tarjeta, monto);
        linea(t, 1, monto, { categoriaId: visa ? pagoVisa : pagoMaster });
      } else {
        const monto = 1_000 + Math.floor(rng() * 30_000);
        const t = nueva('transferencia', fecha, monto);
        const alAhorro = rng() < 0.5;
        efecto(t, alAhorro ? cuentas.efectivo : cuentas.ahorros, -monto);
        efecto(t, alAhorro ? cuentas.ahorros : cuentas.efectivo, monto);
      }
    }
    periodos.push({ inicio, hoy, filas: f });
  }
  return periodos;
}

/** Los hechos completos del volumen, para `calcular`. El último período termina en `fechaFinal(op)`. */
export function generarHechos(op: OpcionesVolumen): Hechos {
  const todo = vacio();
  for (const p of generarPeriodos(op))
    for (const t of TABLAS_MOTOR) (todo[t] as object[]).push(...p.filas[t]);
  return todo;
}

/** El `hoy` con que se calcula el volumen: el fin del último período. */
export const fechaFinal = (op: Pick<OpcionesVolumen, 'anios'>): FechaLocal =>
  finDelPeriodo(Math.round(op.anios * 12) - 1);

/** Filas por tabla de unos hechos y el total (lo que imprime el CLI). */
export function conteo(h: Hechos | FilasMotor): { total: number; tablas: Record<string, number> } {
  const tablas = Object.fromEntries(TABLAS_MOTOR.map((t) => [t, h[t].length]));
  return { total: Object.values(tablas).reduce((a, b) => a + b, 0), tablas };
}

if (import.meta.main) {
  const { values } = (await import('node:util')).parseArgs({
    options: {
      nivel: { type: 'string', default: 'alto' },
      anios: { type: 'string', default: '10' },
      semilla: { type: 'string', default: '1' },
    },
  });
  if (values.nivel !== 'base' && values.nivel !== 'alto')
    throw new Error(`--nivel: base o alto, no "${values.nivel}"`);
  const op: OpcionesVolumen = {
    nivel: values.nivel,
    anios: Number(values.anios),
    semilla: Number(values.semilla),
  };
  if (!(op.anios > 0) || !Number.isInteger(op.semilla))
    throw new Error('--anios > 0 y --semilla entero');
  const h = generarHechos(op);
  console.log(JSON.stringify({ ...op, hoyFinal: fechaFinal(op), ...conteo(h) }, null, 2));
}
