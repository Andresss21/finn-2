import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Categoria,
  Condonacion,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Instante,
  Linea,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { actividad } from './actividad';
import { detalleTransaccion } from './detalle-transaccion';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Estado conocido: hoy = 2027-04-15, ciclo mensual (día 1). Cuentas `ef` (efectivo) y `vi` (tarjeta).
 * Marzo: saldo inicial 1000 y una compra de 60 (período cerrado). Abril: una compra programada de 40
 * con la tarjeta (día 5), una compra conciliada de 200 en `super` con 150 de categoría y 50 por cobrar
 * a Ana (día 10), un cobro de 30 (día 12) y una devolución D-1 de 20 (día 13).
 */
function estado() {
  const cuentas = [
    { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', fechaApertura: f('2027-03-01') },
    { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', fechaApertura: f('2027-03-01') },
  ].map((k) => ({ ultimos4: null, institucionId: null, orden: 1, archivada: false, ...k }));
  const grupos = [
    { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
    { id: id('pagos'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
  ] as Grupo[];
  const categorias = [
    { id: id('super'), grupoId: id('hogar'), nombre: 'Super', clase: 'normal', tarjetaId: null },
    {
      id: id('pago-vi'),
      grupoId: id('pagos'),
      nombre: 'Pago Visa',
      clase: 'pago',
      tarjetaId: id('vi'),
    },
  ].map((x) => ({ orden: 1, archivada: false, ...x })) as Categoria[];
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (
    tx: string,
    tipo: Transaccion['tipo'],
    fecha: string,
    cuenta: string,
    monto: number,
    extra: Partial<Transaccion> = {},
  ) => {
    transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      horaRegistro: `${fecha}T12:00:00.000Z` as Instante,
      claveOrden: `${fecha}T12:00:00.000Z` as Instante,
      secuencia: String(transacciones.length + 1),
      origen: 'manual',
      estadoBancario: 'confirmada',
      conciliacionId: null,
      comercio: null,
      nota: null,
      total: c(Math.abs(monto)),
      monedaOriginal: null,
      montoOriginal: null,
      lineaCobradaId: null,
      revision: null,
      ...extra,
    });
    efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id(cuenta),
      monto: c(monto),
      interes: null,
      seguro: null,
      revision: null,
    });
  };
  const linea = (tx: string, orden: number, monto: number, extra: Partial<Linea>) =>
    lineas.push({
      id: id(`l-${tx}-${orden}`),
      transaccionId: id(tx),
      orden,
      monto: c(monto),
      categoriaId: null,
      deudorId: null,
      lineaOriginalId: null,
      revision: null,
      ...extra,
    });
  mov('si', 'saldo_inicial', '2027-03-01', 'ef', 1000);
  mov('g-mar', 'gasto', '2027-03-10', 'ef', -60, { comercio: 'FARMACIA' });
  linea('g-mar', 1, 60, { categoriaId: id('super') });
  mov('g-prog', 'gasto', '2027-04-05', 'vi', -40, { comercio: 'NETFLIX', origen: 'programada' });
  linea('g-prog', 1, 40, { categoriaId: id('super') });
  mov('g-super', 'gasto', '2027-04-10', 'ef', -200, {
    comercio: 'SUPER SELECTOS',
    nota: 'compra grande',
    estadoBancario: 'conciliada',
    conciliacionId: id('con1'),
  });
  linea('g-super', 1, 150, { categoriaId: id('super') });
  linea('g-super', 2, 50, { deudorId: id('ana') });
  mov('cobro', 'cobro', '2027-04-12', 'ef', 30, { lineaCobradaId: id('l-g-super-2') });
  mov('dev', 'devolucion', '2027-04-13', 'ef', 20);
  linea('dev', 1, 20, { categoriaId: id('super'), lineaOriginalId: id('l-g-super-1') });
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: cuentas as Cuenta[],
    tarjetas: [
      {
        cuentaId: id('vi'),
        tipo: 'tarjeta',
        limiteCredito: c(1000),
        tasaAnualMillonesimas: null,
        diaCorte: 1,
        diaPago: 17,
        red: null,
        color: null,
        revision: null,
      },
    ],
    prestamos: [],
    inversiones: [],
    grupos,
    categorias,
    asignaciones: [],
    deudores: [{ id: id('ana'), nombre: 'Ana', revision: null }],
    transacciones,
    efectos,
    lineas,
    condonaciones: [] as Condonacion[],
    metas: [],
    programadas: [
      {
        id: id('netflix'),
        tipo: 'gasto',
        cuentaId: id('vi'),
        cuentaDestinoId: null,
        comercio: 'NETFLIX',
        monto: c(40),
        tolerancia: c(0),
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: f('2027-04-05'),
        fechaFin: null,
        registroAutomatico: true,
        activa: true,
        revision: null,
      },
    ],
    programada_lineas: [],
    ocurrencias_resueltas: [
      {
        id: id('oc1'),
        programadaId: id('netflix'),
        fechaEsperada: f('2027-04-05'),
        estado: 'registrada',
        transaccionId: id('g-prog'),
        revision: null,
      },
    ],
    conciliaciones: [
      {
        id: id('con1'),
        cuentaId: id('ef'),
        fechaEstado: f('2027-04-10'),
        saldoEstado: c(740),
        terminadaEn: '2027-04-11T08:00:00.000Z' as Instante,
        diferenciaAceptada: c(0),
        revision: null,
      },
    ],
  };
  return calcular(hechos, f('2027-04-15'));
}

const i = estado();
const ids = (a: ReturnType<typeof actividad>) =>
  a.dias.flatMap((d) => d.transacciones.map((t) => t.id));

describe('actividad y detalle de transacción', () => {
  it('PRU-DOM-CTA-103 [CB-21] la actividad va en orden inverso, agrupada por día, con montos presentados y marcas', () => {
    const a = actividad(i);
    expect(a.dias.map((d) => d.fecha)).toEqual(
      ['2027-04-13', '2027-04-12', '2027-04-10', '2027-04-05', '2027-03-10', '2027-03-01'].map(f),
    );
    const por = new Map(a.dias.flatMap((d) => d.transacciones).map((t) => [t.id, t]));
    const g = por.get(id('g-super'));
    expect(g?.montoPresentado).toBe(c(-200));
    expect(g?.lineas.map((l) => [l.destino.nombre, l.destino.tipo, l.monto])).toEqual([
      ['Super', 'categoria', c(150)],
      ['Ana', 'deudor', c(50)],
    ]);
    expect(g?.marcas).toEqual({
      porCobrar: true,
      conDevoluciones: true,
      conciliada: true,
      programada: false,
      periodoCerrado: false,
    });
    expect(por.get(id('cobro'))?.montoPresentado).toBe(c(30));
    expect(por.get(id('si'))?.montoPresentado).toBe(c(1000));
    expect(por.get(id('g-mar'))?.marcas.periodoCerrado).toBe(true);
    expect(por.get(id('g-prog'))?.marcas.programada).toBe(true);
    // La devolución sigue el destino de su línea original.
    expect(por.get(id('dev'))?.lineas[0]?.destino).toMatchObject({
      nombre: 'Super',
      tipo: 'categoria',
    });
  });

  it('PRU-DOM-CTA-103 la búsqueda por texto y los filtros se combinan sobre los hechos', () => {
    expect(ids(actividad(i, { idsDeTexto: new Set([id('g-super')]) }))).toEqual([id('g-super')]);
    expect(ids(actividad(i, { idsDeTexto: new Set() }))).toEqual([]);
    expect(ids(actividad(i, { cuentaId: id('vi') }))).toEqual([id('g-prog')]);
    expect(ids(actividad(i, { categoriaId: id('super'), desde: f('2027-04-01') }))).toEqual([
      id('dev'),
      id('g-super'),
      id('g-prog'),
    ]);
    expect(ids(actividad(i, { montoDesde: c(100), montoHasta: c(300) }))).toEqual([id('g-super')]);
    expect(ids(actividad(i, { tipo: 'gasto', estado: 'conciliada' }))).toEqual([id('g-super')]);
    expect(ids(actividad(i, { origen: 'programada', hasta: f('2027-04-05') }))).toEqual([
      id('g-prog'),
    ]);
  });

  it('PRU-DOM-CTA-103 el cursor continúa donde terminó la página sin repetir ni saltar filas', () => {
    const p1 = actividad(i, { limite: 4 });
    expect(ids(p1)).toEqual([id('dev'), id('cobro'), id('g-super'), id('g-prog')]);
    expect(p1.siguienteCursor).toBeDefined();
    const p2 = actividad(i, { limite: 4, cursor: p1.siguienteCursor as string });
    expect(ids(p2)).toEqual([id('g-mar'), id('si')]);
    expect(p2.siguienteCursor).toBeUndefined();
  });

  it('PRU-DOM-CTA-103 [AV-16] el detalle trae las líneas con sus eventos y las restricciones', () => {
    const d = detalleTransaccion(i, id('g-super'), {
      cambios: [
        {
          id: id('cp1'),
          conciliacionId: id('con1'),
          transaccionId: id('g-super'),
          registradoEn: '2027-04-14T09:00:00.000Z' as Instante,
          motivos: ['monto'],
          fecha: f('2027-04-10'),
          montoEfecto: c(-200),
          comercio: null,
        },
      ],
    });
    expect(d.transaccion).toMatchObject({ nota: 'compra grande', comercio: 'SUPER SELECTOS' });
    expect(d.transaccion.periodo.inicio).toBe(f('2027-04-01'));
    expect(d.efectos).toEqual([{ cuenta: { id: id('ef'), nombre: 'Efectivo' }, monto: c(-200) }]);
    const [cat, cobrar] = d.lineas;
    expect(cat?.devoluciones).toEqual([
      { transaccionId: id('dev'), fecha: f('2027-04-13'), monto: c(20), caso: 'D-1' },
    ]);
    expect((cat?.reparto?.cubierto ?? 0) + (cat?.reparto?.noCubierto ?? 0)).toBe(c(130));
    expect(cobrar?.destino).toEqual({ deudor: { id: id('ana'), nombre: 'Ana' } });
    expect(cobrar?.porCobrar).toEqual({
      abierto: c(20),
      restituido: c(30),
      condonado: c(0),
      devuelto: c(0),
      estado: 'parcial',
    });
    expect(cobrar?.cobros).toEqual([
      {
        transaccionId: id('cobro'),
        fecha: f('2027-04-12'),
        monto: c(30),
        restitucion: c(30),
        excedente: c(0),
      },
    ]);
    expect(d.conciliacion).toEqual({ id: id('con1'), fechaEstado: f('2027-04-10') });
    expect(d.cambiosPosteriores).toEqual([
      { registradoEn: '2027-04-14T09:00:00.000Z', motivos: ['monto'] },
    ]);
    expect(d.restricciones).toEqual({
      puedeEliminar: false,
      motivoNoEliminar: 'transaccion_con_eventos',
      puedeCambiarCuenta: false,
      puedeCambiarFecha: { minima: f('2027-03-01'), maxima: f('2027-04-12') },
      lineasConEventos: [id('l-g-super-1'), id('l-g-super-2')],
      conciliada: true,
    });
  });

  it('PRU-DOM-CTA-103 el origen sale de la programada o del SMS, y una transacción sin eventos se puede eliminar', () => {
    const p = detalleTransaccion(i, id('g-prog'));
    expect(p.origenDetalle).toEqual({
      programada: {
        programada: { id: id('netflix'), nombre: 'NETFLIX' },
        fechaEsperada: f('2027-04-05'),
      },
    });
    expect(p.restricciones).toMatchObject({
      puedeEliminar: true,
      puedeCambiarCuenta: true,
      puedeCambiarFecha: { minima: f('2027-03-01'), maxima: f('2027-04-15') },
      lineasConEventos: [],
    });
    const sms = {
      texto: 'Compra $200',
      recibidoEn: '2027-04-10T11:00:00.000Z' as Instante,
      movimientoId: id('mov1'),
    };
    expect(
      detalleTransaccion(i, id('g-mar'), { sms: new Map([[id('g-mar'), sms]]) }).origenDetalle,
    ).toEqual({
      sms,
    });
    expect(() => detalleTransaccion(i, id('no-existe'))).toThrow(RangeError);
  });
});
