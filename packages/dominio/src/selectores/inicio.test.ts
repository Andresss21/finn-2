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
  Programada,
  Tarjeta,
  Transaccion,
  TipoTransaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { detalleLpa } from './detalle-lpa';
import { inicio } from './inicio';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Estado conocido: hoy = 2027-04-15, ciclo mensual (día 1). Marzo cerrado y abril activo.
 * Cuentas `ef` (efectivo) y `vi` (tarjeta, corte 1 y pago 17). Marzo: saldo inicial 1000, ingreso 500,
 * compra de 60 con la tarjeta en `viaje` (cubierta: traslada 60 a `pago-vi`). Abril: `super` gasta 200
 * en efectivo con 150 de fondo (sobregiro de débito 50) y `cine` gasta 40 con la tarjeta sin fondo
 * (sobregiro con tarjeta 40). `vieja` (archivada) conserva 30; `ahorro` tiene una meta anual de 1000.
 */
function estado(ajustar: (h: Hechos) => Hechos = (h) => h) {
  const cuentas = [
    { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
    { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', archivada: false },
  ] as Cuenta[];
  const grupos = [
    { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
    { id: id('ocio'), nombre: 'Ocio', orden: 2, archivado: false, claveSistema: null },
    {
      id: id('pagos'),
      nombre: 'Pagos de tarjeta',
      orden: 3,
      archivado: false,
      claveSistema: 'pagos',
    },
  ] as Grupo[];
  const cat = (n: string, g: string, orden: number, extra: Partial<Categoria> = {}) =>
    ({
      id: id(n),
      grupoId: id(g),
      nombre: n,
      orden,
      clase: 'normal',
      tarjetaId: null,
      archivada: false,
      ...extra,
    }) as Categoria;
  const categorias = [
    cat('super', 'hogar', 1),
    cat('ropa', 'hogar', 2),
    cat('cine', 'ocio', 3),
    cat('viaje', 'ocio', 4),
    cat('vieja', 'ocio', 5, { archivada: true }),
    cat('ahorro', 'ocio', 6),
    cat('pago-vi', 'pagos', 1, { clase: 'pago', tarjetaId: id('vi') }),
  ];
  const asig = (cat: string, periodo: string, monto: number) =>
    ({
      id: id(`a-${cat}-${periodo}`),
      categoriaId: id(cat),
      periodoInicio: f(periodo),
      monto: c(monto),
    }) as Asignacion;
  const asignaciones = [
    asig('super', '2027-03-01', 100),
    asig('vieja', '2027-03-01', 30),
    asig('viaje', '2027-03-01', 60),
    asig('super', '2027-04-01', 50),
    asig('ropa', '2027-04-01', 10),
    asig('ahorro', '2027-04-01', 250),
  ];
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    cuenta: string,
    monto: number,
    categoria?: string,
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
    if (categoria !== undefined)
      lineas.push({
        id: id(`l-${tx}`),
        transaccionId: id(tx),
        orden: 1,
        monto: c(Math.abs(monto)),
        categoriaId: id(categoria),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea);
  };
  mov('si', 'saldo_inicial', '2027-03-01', 'ef', 1000);
  mov('ing', 'ingreso', '2027-03-05', 'ef', 500);
  mov('g-viaje', 'gasto', '2027-03-10', 'vi', -60, 'viaje');
  mov('g-super', 'gasto', '2027-04-10', 'ef', -200, 'super');
  mov('g-cine', 'gasto', '2027-04-10', 'vi', -40, 'cine');
  const programada = (n: string, fecha: string, monto: number) =>
    ({
      id: id(n),
      tipo: 'gasto',
      cuentaId: id('ef'),
      cuentaDestinoId: null,
      comercio: n.toUpperCase(),
      monto: c(monto),
      tolerancia: c(0),
      frecuencia: 'mensual',
      frecuenciaDias: null,
      primeraFecha: f(fecha),
      fechaFin: null,
      registroAutomatico: n === 'netflix',
      activa: true,
    }) as Programada;
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas,
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
    grupos,
    categorias,
    asignaciones,
    deudores: [],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [
      {
        id: id('m-ahorro'),
        categoriaId: id('ahorro'),
        tipo: 'anual',
        modo: null,
        monto: c(1000),
        fechaObjetivo: null,
        fechaCreacion: f('2027-01-01'),
      },
      {
        id: id('m-viaje'),
        categoriaId: id('viaje'),
        tipo: 'para_fecha',
        modo: null,
        monto: c(500),
        fechaObjetivo: f('2027-03-31'),
        fechaCreacion: f('2027-01-01'),
      },
    ] as Meta[],
    programadas: [
      programada('netflix', '2027-04-18', 15),
      programada('renta', '2027-04-10', 300),
      programada('luz', '2027-04-30', 40),
    ],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return calcular(ajustar(hechos), f('2027-04-15'));
}

const i = estado();

describe('selectores de Inicio y detalle de LPA', () => {
  it('PRU-DOM-PRES-104 [AV-07, AV-14, AV-17] Inicio: atención, próximos pagos a 7 días (BE-37), pagos de tarjeta y patrimonio', () => {
    const x = inicio(i, false);
    expect(x.atencion.hallazgosRitmo).toEqual([]);
    expect([x.lpa, x.enCamino, x.lpaNegativo, x.reduccionProyectadaAlCierre]).toEqual([
      c(1000),
      0,
      false,
      c(50),
    ]);
    expect(
      x.atencion.sobregiradas.map((s) => [s.categoria.nombre, s.grupo.nombre, s.sobregiro.tipo]),
    ).toEqual([
      ['super', 'Hogar', 'debito'],
      ['cine', 'Ocio', 'tarjeta'],
    ]);
    expect(x.atencion.faltaReservar).toEqual([
      { tarjeta: { id: 'vi', nombre: 'Visa' }, monto: c(40) },
    ]);
    expect([x.atencion.pagosExcedentes, x.atencion.reservaExcedente]).toEqual([[], []]);
    expect(
      x.atencion.proximosPagos.map((o) => [
        o.programada.nombre,
        o.fechaEsperada,
        o.monto,
        o.registroAutomatico,
        o.atrasada,
      ]),
    ).toEqual([['NETFLIX', f('2027-04-18'), c(15), true, false]]);
    expect(
      x.atencion.pagosAtrasados.map((o) => [o.programada.nombre, o.fechaEsperada, o.atrasada]),
    ).toEqual([['RENTA', f('2027-04-10'), true]]);
    expect(x.atencion.metasVencidas).toEqual([
      { categoria: { id: 'viaje', nombre: 'viaje' }, falta: c(500) },
    ]);
    expect(x.atencion.archivadasConDisponible).toEqual([
      { categoria: { id: 'vieja', nombre: 'vieja', archivada: true }, disponible: c(30) },
    ]);
    // Pago el 17 (2 días) y 60 de deuda anterior al corte del 1 de abril, sin pagos desde entonces.
    expect(x.atencion.pagosTarjetaProximos).toEqual([
      {
        tarjeta: { id: 'vi', nombre: 'Visa' },
        fechaPago: f('2027-04-17'),
        paraNoGenerarIntereses: c(60),
      },
    ]);
    expect(x.patrimonio).toEqual({ activos: c(1300), deudas: c(100), neto: c(1200) });
  });

  it('PRU-DOM-PRES-104 CF-18 (primeros pasos): primerosPasos es null cuando los tres pasos están hechos', () => {
    expect(inicio(i, false).primerosPasos).toEqual({ cuenta: true, categorias: true, sms: false });
    expect(inicio(i, true).primerosPasos).toBeNull();
  });

  it('PRU-DOM-PRES-104 [AV-14] Inicio con la tarjeta archivada, sin programadas ni categorías normales: listas vacías y primerosPasos incompleto', () => {
    const v = estado((h) => ({
      ...h,
      cuentas: h.cuentas.map((x) => (x.id === id('vi') ? { ...x, archivada: true } : x)),
      programadas: [],
      categorias: h.categorias.map((x) => ({ ...x, clase: 'pago' as const })),
    }));
    const x = inicio(v, true);
    expect(x.atencion.pagosTarjetaProximos).toEqual([]);
    expect(x.atencion.proximosPagos).toEqual([]);
    expect(x.atencion.pagosAtrasados).toEqual([]);
    expect(x.atencion.sobregiradas).toEqual([]);
    expect(x.primerosPasos).toEqual({ cuenta: true, categorias: false, sms: true });
  });

  it('PRU-DOM-PRES-104 [AV-14] Inicio: con el día de pago ya pasado, la tarjeta paga el mes siguiente y queda fuera de los 3 días', () => {
    const v = estado((h) => ({
      ...h,
      tarjetas: h.tarjetas.map((t) => ({ ...t, diaPago: 10 })),
    }));
    expect(inicio(v, false).atencion.pagosTarjetaProximos).toEqual([]);
    // Una ocurrencia cuya programada ya no está en los hechos se omite en vez de inventar datos.
    const huerfana = { ...i, hechos: { ...i.hechos, programadas: [] } };
    expect(inicio(huerfana, false).atencion.proximosPagos).toEqual([]);
  });

  it('PRU-DOM-PRES-104 detalle de LPA: la descomposición suma lpa; reducción proyectada e historial (B-4)', () => {
    const d = detalleLpa(i);
    expect(d.lpa).toBe(c(1000));
    expect(d.descomposicion).toEqual({
      entradas: { ingresos: c(500), otrasEntradas: 0, restituciones: 0, saldosIniciales: c(1000) },
      asignadoPeriodosCerrados: c(190),
      asignadoPeriodoActivo: c(310),
      asignadoPeriodosFuturos: 0,
      reduccionesSobregiroDebito: 0,
      reduccionesPagoExcedente: 0,
      enCamino: 0,
    });
    const k = d.descomposicion;
    expect(
      k.entradas.ingresos +
        k.entradas.otrasEntradas +
        k.entradas.restituciones +
        k.entradas.saldosIniciales -
        (k.asignadoPeriodosCerrados +
          k.asignadoPeriodoActivo +
          k.asignadoPeriodosFuturos +
          k.reduccionesSobregiroDebito +
          k.reduccionesPagoExcedente +
          k.enCamino),
    ).toBe(d.lpa);
    expect(d.reduccionProyectadaAlCierre).toEqual({
      total: c(50),
      categorias: [{ categoria: { id: 'super', nombre: 'super' }, monto: c(50) }],
      tarjetas: [],
    });
    expect(d.historial.map((h) => [h.periodo.inicio, h.lpaAlCierre])).toEqual([
      [f('2027-03-01'), c(1310)],
    ]);
    expect(d.notaHistorial).toBe('sin_adelantos');
    expect(() => detalleLpa(i, 0)).toThrow(RangeError);
  });
});
