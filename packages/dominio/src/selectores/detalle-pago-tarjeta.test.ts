// PRU-DOM-CATEG-103: detalle de una categoría de pago (traslados, pagos, pagos implícitos,
// devoluciones D-3 y D-4, pago excedente y desglose al pagar) sobre un estado armado a mano
// (hoy = 2027-04-15, corte de la tarjeta el 10 y pago el 28).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Deudor,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { detalleCategoria } from './detalle-categoria';
import { detallePagoTarjeta } from './detalle-pago-tarjeta';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

const cuentas = [
  { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo' },
  { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa' },
] as Cuenta[];
const grupos = [
  { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
  { id: id('pagos'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
] as Grupo[];
const categorias = [
  { id: id('super'), grupoId: id('hogar'), nombre: 'super', orden: 1, clase: 'normal' },
  { id: id('ropa'), grupoId: id('hogar'), nombre: 'ropa', orden: 2, clase: 'normal' },
  {
    id: id('pago-vi'),
    grupoId: id('pagos'),
    nombre: 'Pago Visa',
    orden: 1,
    clase: 'pago',
    tarjetaId: id('vi'),
  },
].map((x) => ({ tarjetaId: null, archivada: false, ...x })) as Categoria[];

const asignaciones: Asignacion[] = [];
const asignar = (categoria: string, periodo: string, monto: number) =>
  asignaciones.push({
    id: id(`a-${categoria}-${periodo}`),
    categoriaId: id(categoria),
    periodoInicio: f(periodo),
    monto: c(monto),
  } as Asignacion);
asignar('pago-vi', '2027-02-01', 5);
asignar('pago-vi', '2027-03-01', 10);
asignar('ropa', '2027-03-01', 50);
asignar('super', '2027-04-01', 100);
asignar('ropa', '2027-04-01', 10);

const transacciones: Transaccion[] = [];
const efectos: Efecto[] = [];
const lineas: Linea[] = [];
function mov(
  tx: string,
  tipo: Transaccion['tipo'],
  fecha: string,
  mueve: readonly (readonly [string, number])[],
  linea?: { cat: string | null; monto: number; de?: string; deudor?: string },
  extra: Partial<Transaccion> = {},
) {
  transacciones.push({
    id: id(tx),
    tipo,
    fecha: f(fecha),
    claveOrden: `${fecha}T12:00:00.000Z`,
    secuencia: String(transacciones.length + 1),
    estadoBancario: 'confirmada',
    comercio: null,
    total: c(Math.abs(mueve[0]?.[1] ?? 0)),
    lineaCobradaId: null,
    ...extra,
  } as Transaccion);
  for (const [cuenta, monto] of mueve)
    efectos.push({
      id: id(`ef-${tx}-${cuenta}`),
      transaccionId: id(tx),
      cuentaId: id(cuenta),
      monto: c(monto),
      interes: null,
      seguro: null,
    } as Efecto);
  if (linea !== undefined)
    lineas.push({
      id: id(`${tx}-0`),
      transaccionId: id(tx),
      orden: 1,
      monto: c(linea.monto),
      categoriaId: linea.cat === null ? null : id(linea.cat),
      deudorId: linea.deudor === undefined ? null : id(linea.deudor),
      lineaOriginalId: linea.de === undefined ? null : id(linea.de),
    } as Linea);
}
mov('si', 'saldo_inicial', '2027-02-01', [['ef', 5000]]);
mov(
  'p0',
  'pago_tarjeta',
  '2027-02-15',
  [
    ['ef', -20],
    ['vi', 20],
  ],
  { cat: 'pago-vi', monto: 20 },
);
// Marzo: compra de ropa con la tarjeta (se cubre con la asignación), otra de 300 sin cubrir y un
// gasto en efectivo por cobrar a Ana.
mov('g-ropa', 'gasto', '2027-03-05', [['vi', -50]], { cat: 'ropa', monto: 50 });
mov('g-otro', 'gasto', '2027-03-06', [['vi', -300]], { cat: 'super', monto: 300 });
mov('g-ana', 'gasto', '2027-03-20', [['ef', -60]], { cat: null, monto: 60, deudor: 'ana' });
// Abril.
mov('g-abr-ef', 'gasto', '2027-04-02', [['ef', -30]], { cat: 'super', monto: 30 });
mov('g-abr-vi', 'gasto', '2027-04-03', [['vi', -40]], { cat: 'super', monto: 40 });
mov('g-ropa-abr', 'gasto', '2027-04-04', [['vi', -10]], { cat: 'ropa', monto: 10 });
mov('d3', 'devolucion', '2027-04-08', [['vi', 20]], { cat: 'ropa', monto: 20, de: 'g-ropa-0' });
mov('d4', 'devolucion', '2027-04-09', [['vi', 15]], { cat: 'super', monto: 15, de: 'g-abr-ef-0' });
mov(
  'p1',
  'pago_tarjeta',
  '2027-04-12',
  [
    ['ef', -130],
    ['vi', 130],
  ],
  { cat: 'pago-vi', monto: 130 },
);
mov('cobro', 'cobro', '2027-04-14', [['vi', 25]], undefined, { lineaCobradaId: id('g-ana-0') });

const hechos: Hechos = {
  vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
  cuentas,
  tarjetas: [
    {
      cuentaId: id('vi'),
      tipo: 'tarjeta',
      diaCorte: 10,
      diaPago: 28,
      limiteCredito: c(1000),
      red: null,
      color: null,
    },
  ],
  prestamos: [],
  inversiones: [],
  grupos,
  categorias,
  asignaciones,
  deudores: [{ id: id('ana'), nombre: 'Ana' } as Deudor],
  transacciones,
  efectos,
  lineas,
  condonaciones: [],
  metas: [],
  programadas: [],
  programada_lineas: [],
  ocurrencias_resueltas: [],
  conciliaciones: [],
} as unknown as Hechos;
const i = calcular(hechos, f('2027-04-15'));

describe('detalle de categoría de pago', () => {
  it('PRU-DOM-CATEG-103 [INV-05] lista traslados, pagos, pagos implícitos y devoluciones D-3 y D-4 del período', () => {
    const d = detallePagoTarjeta(i, id('pago-vi'));
    expect(d.clase).toBe('pago');
    expect(d.categoria).toEqual({ id: 'pago-vi', nombre: 'Pago Visa' });
    expect(d.tarjeta).toEqual({ id: 'vi', nombre: 'Visa' });
    expect(d.periodo.inicio).toBe('2027-04-01');
    expect(d.navegacion.anterior).toBe('2027-03-01');
    expect(d.navegacion.siguiente).toBe('2027-05-01');
    // Traslados: 40 de super y 10 de ropa (cubiertos). Pagos 130; implícito 25; D-3 r = 20 (U_L = 0);
    // D-4 X = 15. Act = 50 − 130 − 25 − 20 − 15 = −140; Arr = 5 − 20 → 0, +10 + 50 en marzo = 60.
    expect(d.traslados).toEqual([
      { categoria: { id: 'super', nombre: 'super' }, monto: c(40) },
      { categoria: { id: 'ropa', nombre: 'ropa' }, monto: c(10) },
    ]);
    expect(d.pagos).toEqual([{ transaccionId: 'p1', fecha: '2027-04-12', monto: c(130) }]);
    expect(d.pagosImplicitos).toEqual([
      { transaccionId: 'cobro', fecha: '2027-04-14', monto: c(25) },
    ]);
    expect(d.devoluciones).toEqual([
      { transaccionId: 'd3', fecha: '2027-04-08', caso: 'D-3', monto: c(20) },
      { transaccionId: 'd4', fecha: '2027-04-09', caso: 'D-4', monto: c(15) },
    ]);
    expect(d.numeros).toEqual({
      asignado: c(0),
      actividad: c(-140),
      arrastre: c(60),
      disponible: c(-80),
    });
  });

  it('PRU-DOM-CATEG-103 [INV-02, AV-05] muestra la tarjeta de hoy y el pago excedente con sus causas', () => {
    const d = detallePagoTarjeta(i, id('pago-vi'));
    // Saldo: +20 (feb) − 50 − 300 (mar) − 40 − 10 + 20 + 15 + 130 + 25 (abr) = −190.
    expect(d.tarjetaHoy).toEqual({
      deuda: c(190),
      saldoAFavor: c(0),
      reservado: c(0),
      faltaReservar: c(190),
      reservaExcedente: c(0),
    });
    // E = 80: cobros 25, devoluciones 20 + 15, pagos el resto (§4.7).
    expect(d.pagoExcedente).toEqual({
      total: c(80),
      causas: [
        { causa: 'cobro', monto: c(25) },
        { causa: 'devolucion', monto: c(35) },
        { causa: 'pago', monto: c(20) },
      ],
    });
  });

  it('PRU-DOM-CATEG-103 el desglose al pagar parte del último corte y usa hoy', () => {
    const d = detallePagoTarjeta(i, id('pago-vi'));
    // Corte 10 de abril: saldo −345 → deuda anterior 345; ya pagado 130 + 25; sin cargos nuevos.
    expect(d.desgloseAlPagar).toEqual({
      deudaAnterior: c(345),
      cargosDelCiclo: c(0),
      yaPagado: c(155),
      paraNoGenerarIntereses: c(190),
      ultimoCorte: '2027-04-10',
      proximoPago: '2027-04-28',
    });
  });

  it('PRU-DOM-CATEG-103 el historial toma los cerrados en que existía y un cerrado con exceso no da causas', () => {
    const d = detallePagoTarjeta(i, id('pago-vi'));
    expect(d.historial.map((x) => [x.periodo.inicio, x.asignado, x.disponible])).toEqual([
      ['2027-02-01', c(5), c(-15)],
      ['2027-03-01', c(10), c(60)],
    ]);
    const feb = detallePagoTarjeta(i, id('pago-vi'), { periodoInicio: f('2027-02-01') });
    expect(feb.navegacion.anterior).toBeUndefined();
    expect(feb.pagos).toEqual([{ transaccionId: 'p0', fecha: '2027-02-15', monto: c(20) }]);
    expect(feb.pagoExcedente).toEqual({ total: c(15), causas: [] });
    const mar = detallePagoTarjeta(i, id('pago-vi'), { periodoInicio: f('2027-03-01') });
    expect(mar.traslados).toEqual([{ categoria: { id: 'ropa', nombre: 'ropa' }, monto: c(50) }]);
    expect(mar.pagoExcedente).toBeNull();
    expect(mar.historial.map((x) => x.periodo.inicio)).toEqual(['2027-02-01']);
  });

  it('PRU-DOM-CATEG-103 rechaza categorías normales, inexistentes y períodos fuera del presupuesto', () => {
    expect(() => detallePagoTarjeta(i, id('super'))).toThrow(RangeError);
    expect(() => detallePagoTarjeta(i, id('nada'))).toThrow(RangeError);
    expect(() => detallePagoTarjeta(i, id('pago-vi'), { periodoInicio: f('2020-01-01') })).toThrow(
      RangeError,
    );
    expect(() => detalleCategoria(i, id('pago-vi'))).toThrow(RangeError);
  });
});
