// FT-14, números del detalle de categoría que sale del motor (07 §17: un número del motor es una DOM): la intensidad de cada día
// del calendario (CA-14.8), «Se pasó k de n» y el promedio del historial (CA-14.9) y el progreso de una meta de ahorro (CA-14.10).
// Cada caso arma sus hechos mínimos: una cuenta de efectivo, una categoría, sus asignaciones, sus gastos y, si hace falta, su meta.
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Meta,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { detalleCategoria } from './detalle-categoria';
import { metas } from './metas';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

interface Caso {
  /** [inicio del período (ciclo del día 1), monto asignado] */
  readonly asignaciones: readonly (readonly [string, number])[];
  /** [fecha, monto] de gastos (positivo) o devoluciones (negativo) con efectivo */
  readonly movimientos?: readonly (readonly [string, number])[];
  readonly meta?: { readonly monto: number; readonly fechaObjetivo: string };
  readonly hoy: string;
}

/** Los hechos de un caso y el detalle de `Ahorro` en su período activo. */
function detalle(caso: Caso) {
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mover = (tx: string, tipo: Transaccion['tipo'], fecha: string, monto: number) => {
    transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: tx,
      total: c(Math.abs(monto)),
      lineaCobradaId: null,
    } as Transaccion);
    efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id('ef'),
      monto: c(monto),
      interes: null,
      seguro: null,
    } as Efecto);
    if (tipo === 'saldo_inicial') return;
    lineas.push({
      id: id(`${tx}-0`),
      transaccionId: id(tx),
      orden: 1,
      monto: c(Math.abs(monto)),
      categoriaId: id('ahorro'),
      deudorId: null,
      lineaOriginalId: null,
    } as Linea);
  };
  mover('si', 'saldo_inicial', '2026-01-01', 100000);
  (caso.movimientos ?? []).forEach(([fecha, monto], k) => {
    mover(`m${k}`, monto > 0 ? 'gasto' : 'devolucion', fecha, -monto);
  });
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [{ id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo' }] as Cuenta[],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('g'), nombre: 'Ahorro', orden: 1, archivado: false, claveSistema: null },
    ] as Grupo[],
    categorias: [
      {
        id: id('ahorro'),
        grupoId: id('g'),
        nombre: 'Ahorro',
        orden: 1,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      },
    ] as Categoria[],
    asignaciones: caso.asignaciones.map(
      ([inicio, monto]) =>
        ({
          id: id(`a-${inicio}`),
          categoriaId: id('ahorro'),
          periodoInicio: f(inicio),
          monto: c(monto),
        }) as Asignacion,
    ),
    deudores: [],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas:
      caso.meta === undefined
        ? []
        : ([
            {
              id: id('m'),
              categoriaId: id('ahorro'),
              tipo: 'para_fecha',
              modo: null,
              monto: c(caso.meta.monto),
              fechaObjetivo: f(caso.meta.fechaObjetivo),
              fechaCreacion: f('2027-01-01'),
            },
          ] as Meta[]),
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  const i = calcular(hechos, f(caso.hoy));
  return { i, d: detalleCategoria(i, id('ahorro')) };
}

describe('PRU-DOM-PRES-108 detalle de categoría: calendario, historial y meta', () => {
  it('PRU-DOM-PRES-108 [CA-14.8] gasto de $10.00, $40.00 y $20.00 en tres días da una intensidad de 2,500, 10,000 y 5,000', () => {
    const { d } = detalle({
      asignaciones: [['2027-04-01', 200]],
      movimientos: [
        ['2027-04-03', 10],
        ['2027-04-05', 40],
        ['2027-04-08', 20],
      ],
      hoy: '2027-04-15',
    });
    expect(d.calendario).toEqual([
      { fecha: '2027-04-03', gastado: c(10), intensidadBp: 2500 },
      { fecha: '2027-04-05', gastado: c(40), intensidadBp: 10_000 },
      { fecha: '2027-04-08', gastado: c(20), intensidadBp: 5000 },
    ]);
  });

  it('PRU-DOM-PRES-108 [CA-14.8] un día cuyas devoluciones superan los consumos tiene 0 y, si ningún día tiene gasto positivo, todos son 0', () => {
    const { d } = detalle({
      asignaciones: [['2027-04-01', 200]],
      movimientos: [
        ['2027-04-03', 40],
        ['2027-04-05', -15],
      ],
      hoy: '2027-04-15',
    });
    expect(d.calendario.map((x) => x.intensidadBp)).toEqual([10_000, 0]);
    expect(d.calendario[1]?.gastado).toBe(c(-15));
    const soloDevoluciones = detalle({
      asignaciones: [['2027-04-01', 200]],
      movimientos: [['2027-04-05', -15]],
      hoy: '2027-04-15',
    }).d;
    expect(soloDevoluciones.calendario.map((x) => x.intensidadBp)).toEqual([0]);
  });

  it('PRU-DOM-PRES-108 [CA-14.9] con 6 períodos de historial y gasto mayor que lo asignado en 2, «periodosExcedidos» es 2 y el promedio lo da el servidor', () => {
    const { d } = detalle({
      asignaciones: ['01', '02', '03', '04', '05', '06'].map((m) => [`2027-${m}-01`, 100] as const),
      movimientos: [
        ['2027-01-10', 80],
        ['2027-02-10', 130],
        ['2027-03-10', 90],
        ['2027-04-10', 110],
        ['2027-05-10', 60],
        ['2027-06-10', 40],
      ],
      hoy: '2027-07-15',
    });
    expect(d.historial).toHaveLength(6);
    expect(d.historialResumen).toEqual({ promedioGastado: c(85), periodosExcedidos: 2 });
  });

  it('PRU-DOM-PRES-108 [CA-14.9] con 3 períodos en el historial cuenta sobre 3', () => {
    const { d } = detalle({
      asignaciones: ['04', '05', '06'].map((m) => [`2027-${m}-01`, 100] as const),
      movimientos: [
        ['2027-04-10', 120],
        ['2027-05-10', 50],
        ['2027-06-10', 100],
      ],
      hoy: '2027-07-15',
    });
    expect(d.historial).toHaveLength(3);
    expect(d.historialResumen.periodosExcedidos).toBe(1);
  });

  it('PRU-DOM-PRES-108 [CA-14.10] con $1,350.00 de una meta de ahorro de $3,000.00 el progreso es 4,500, el mismo de metas(), y con más de $3,000.00 es 10,000', () => {
    const parcial = detalle({
      asignaciones: [['2027-04-01', 1350]],
      meta: { monto: 3000, fechaObjetivo: '2027-12-31' },
      hoy: '2027-04-15',
    });
    expect(parcial.d.meta?.progresoBp).toBe(4500);
    expect(parcial.d.meta?.id).toBe('m');
    expect(metas(parcial.i).metas[0]?.progreso).toBe(4500);
    const sobrada = detalle({
      asignaciones: [['2027-04-01', 3500]],
      meta: { monto: 3000, fechaObjetivo: '2027-12-31' },
      hoy: '2027-04-15',
    });
    expect(sobrada.d.meta?.progresoBp).toBe(10_000);
  });
});
