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
import { presupuesto } from './presupuesto';

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
function estado() {
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
  return calcular(hechos, f('2027-04-15'));
}

const i = estado();
const nombresDe = (xs: readonly { categoria: { nombre: string } }[]) =>
  xs.map((x) => x.categoria.nombre);

describe('selectores de Inicio, Presupuesto y detalle de LPA', () => {
  it('PRU-DOM-PRES-102 [CA-09.8, AV-02, AV-03] Presupuesto del activo: filas, sobregiros, metas, barras y totales salen de las celdas', () => {
    const p = presupuesto(i);
    expect(p.periodo).toMatchObject({
      inicio: f('2027-04-01'),
      fin: f('2027-04-30'),
      dias: 30,
      estado: 'activo',
      diasTranscurridos: 15,
      diasRestantes: 15,
    });
    expect(p.navegacion).toEqual({ anterior: f('2027-03-01'), siguiente: f('2027-05-01') });
    expect(p.lpa).toBe(c(1000));
    expect(p.grupos.map((g) => g.grupo.nombre)).toEqual(['Hogar', 'Ocio']);
    const [hogar, ocio] = p.grupos;
    const sup = hogar?.categorias[0];
    expect(sup).toMatchObject({
      asignado: c(50),
      gastado: c(200),
      arrastre: c(100),
      disponible: c(-50),
      clasificacion: 'sobregirada',
      asignadoEsperado: c(50),
    });
    expect(sup?.sobregiro).toEqual({
      tipo: 'debito',
      total: c(50),
      parteTarjeta: 0,
      parteDebito: c(50),
    });
    // CF-25: fondo 150, cubierto 150, excedente 50, base 200 → 7500 y 2500.
    expect(sup?.barra).toEqual({ cubiertoBp: 7500, excedenteBp: 2500, tipoExcedente: 'debito' });
    expect(hogar?.categorias[1]?.barra).toEqual({
      cubiertoBp: 0,
      excedenteBp: 0,
      tipoExcedente: null,
    });
    expect(hogar?.totales).toEqual({ asignado: c(60), gastado: c(200), disponible: c(-40) });
    const cine = ocio?.categorias[0];
    expect(cine?.sobregiro).toEqual({
      tipo: 'tarjeta',
      total: c(40),
      parteTarjeta: c(40),
      parteDebito: 0,
    });
    expect(cine?.barra).toEqual({ cubiertoBp: 0, excedenteBp: 10_000, tipoExcedente: 'tarjeta' });
    expect(ocio?.categorias.map((x) => x.categoria.nombre)).toEqual(['cine', 'viaje', 'ahorro']);
    expect(ocio?.categorias[1]).toMatchObject({
      meta: { tipo: 'para_fecha', pedido: c(500), falta: c(500), estado: 'vencida' },
      clasificacion: 'sin_fondos',
    });
    const ahorro = ocio?.categorias[2];
    expect(ahorro).toMatchObject({
      meta: { tipo: 'anual', pedido: c(100), falta: 0, estado: 'en_curso' },
      clasificacion: 'cubierta',
    });
    expect(ahorro?.barra).toEqual({
      cubiertoBp: 0,
      excedenteBp: 0,
      tipoExcedente: null,
      metaBp: 2500,
    });
    expect(p.totales).toEqual({ asignado: c(310), gastado: c(240), disponible: c(260) });
    expect(p.pagosTarjeta).toEqual([
      {
        tarjeta: { id: 'vi', nombre: 'Visa' },
        categoria: { id: 'pago-vi', nombre: 'pago-vi' },
        asignado: 0,
        actividad: 0,
        arrastre: c(60),
        disponible: c(60),
        faltaReservar: c(40),
        reservaExcedente: 0,
        pagoExcedente: null,
      },
    ]);
    expect(
      p.archivadasConDinero.map((x) => [x.categoria.nombre, x.categoria.archivada, x.disponible]),
    ).toEqual([['vieja', true, c(30)]]);
  });

  it('PRU-DOM-PRES-102 BE-39: los filtros son excluyentes y completos; los totales no cambian', () => {
    const nombresEn = (filtro: Parameters<typeof presupuesto>[2]) =>
      presupuesto(i, undefined, filtro).grupos.flatMap((g) => nombresDe(g.categorias));
    expect(nombresEn('sobregiradas')).toEqual(['super', 'cine']);
    expect(nombresEn('sin_fondos')).toEqual(['viaje']);
    expect(nombresEn('cubiertas')).toEqual(['ropa', 'ahorro']);
    expect(nombresEn('todas')).toEqual(['super', 'ropa', 'cine', 'viaje', 'ahorro']);
    expect(presupuesto(i, undefined, 'sin_fondos').totales).toEqual(presupuesto(i).totales);
  });

  it('PRU-DOM-PRES-102 un período cerrado muestra las archivadas con actividad y sin faltaReservar; fuera del rango lanza', () => {
    const marzo = presupuesto(i, f('2027-03-01'));
    expect(marzo.periodo.estado).toBe('cerrado');
    expect(marzo.navegacion).toEqual({ siguiente: f('2027-04-01') });
    expect(marzo.grupos.flatMap((g) => nombresDe(g.categorias))).toContain('vieja');
    expect(marzo.pagosTarjeta[0]).toMatchObject({
      disponible: c(60),
      faltaReservar: 0,
      pagoExcedente: null,
    });
    expect(marzo.archivadasConDinero).toEqual([]);
    expect(() => presupuesto(i, f('2027-05-01'))).toThrow(RangeError);
  });
});
