import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Transaccion,
  TipoTransaccion,
  Uuid,
  VigenciaCiclo,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { coincidenciasDeReglas } from '../reglas';
import {
  categorias,
  cumplimiento,
  existiaEn,
  flujoEfectivo,
  ingresosGastos,
  patrimonio,
  realidad,
  remanente,
  resumenCumplimiento,
  tendencia,
  ultimoPeriodo,
} from './index';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/** Hechos de un ciclo mensual (día 1) armados a mano: una fila por llamada, sin generadores. */
class Libro {
  readonly cuentas: Cuenta[] = [];
  readonly grupos: Grupo[] = [];
  readonly categorias: Categoria[] = [];
  readonly asignaciones: Asignacion[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];

  cuenta(nombre: string, tipo: Cuenta['tipo']) {
    this.cuentas.push({ id: id(nombre), tipo, nombre } as Cuenta);
  }

  grupo(nombre: string, orden: number) {
    this.grupos.push({ id: id(nombre), nombre, orden, archivado: false } as Grupo);
  }

  categoria(nombre: string, grupo: string, orden: number, archivada = false) {
    this.categorias.push({
      id: id(nombre),
      grupoId: id(grupo),
      nombre,
      orden,
      clase: 'normal',
      tarjetaId: null,
      archivada,
    } as Categoria);
  }

  pago(nombre: string, tarjeta: string) {
    this.categorias.push({
      id: id(nombre),
      grupoId: id('hogar'),
      nombre,
      orden: 99,
      clase: 'pago',
      tarjetaId: id(tarjeta),
      archivada: false,
    } as Categoria);
  }

  asignar(cat: string, periodo: string, monto: number) {
    this.asignaciones.push({
      id: id(`asig-${cat}-${periodo}`),
      categoriaId: id(cat),
      periodoInicio: f(periodo),
      monto: c(monto),
    } as Asignacion);
  }

  mov(
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    efectos: [string, number][],
    lineas: { cat?: string; deudor?: string; de?: string; monto: number }[] = [],
    extra: { comercio?: string; cobra?: string; total?: number } = {},
  ) {
    const total = extra.total ?? lineas.reduce((s, l) => s + l.monto, 0);
    this.transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(this.transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: extra.comercio ?? null,
      total: c(total),
      lineaCobradaId: extra.cobra === undefined ? null : id(extra.cobra),
    } as Transaccion);
    efectos.forEach(([cuenta, monto], k) =>
      this.efectos.push({
        id: id(`ef-${tx}-${k}`),
        transaccionId: id(tx),
        cuentaId: id(cuenta),
        monto: c(monto),
        interes: null,
        seguro: null,
      } as Efecto),
    );
    lineas.forEach((l, k) =>
      this.lineas.push({
        id: id(`${tx}-${k}`),
        transaccionId: id(tx),
        orden: k + 1,
        monto: c(l.monto),
        categoriaId: l.cat === undefined ? null : id(l.cat),
        deudorId: l.deudor === undefined ? null : id(l.deudor),
        lineaOriginalId: l.de === undefined ? null : id(l.de),
      } as Linea),
    );
    return this;
  }

  hechos(): Hechos {
    const vigencia = {
      id: id('v1'),
      diaInicio: 1,
      rigeDesde: null,
      revision: null,
    } as VigenciaCiclo;
    return {
      vigencias_ciclo: [vigencia],
      cuentas: this.cuentas,
      tarjetas: [],
      prestamos: [],
      inversiones: [],
      grupos: this.grupos,
      categorias: this.categorias,
      asignaciones: this.asignaciones,
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: [],
      programadas: [],
      programada_lineas: [],
      ocurrencias_resueltas: [],
      conciliaciones: [],
    };
  }
}

/**
 * Estado conocido: hoy = 2027-04-15, ciclo mensual. Enero a marzo cerrados, abril activo (30 días).
 * Dos cuentas (efectivo `ef`, tarjeta `vi`), un por cobrar con cobro de excedente, una devolución D-1,
 * una categoría archivada con actividad y una asignación negativa.
 */
function estado(ademas: (l: Libro) => void = () => undefined) {
  const l = new Libro();
  l.cuenta('ef', 'efectivo');
  l.cuenta('vi', 'tarjeta');
  l.grupo('hogar', 1);
  l.grupo('ocio', 2);
  l.categoria('super', 'hogar', 1);
  l.categoria('renta', 'hogar', 2);
  l.categoria('cine', 'ocio', 3);
  l.categoria('vieja', 'ocio', 4, true);
  l.categoria('viaje', 'ocio', 5);
  l.categoria('ajuste', 'ocio', 6);
  l.pago('pago-vi', 'vi');
  for (const p of ['2027-01-01', '2027-02-01', '2027-03-01']) l.asignar('super', p, 100);
  for (const p of ['2027-01-01', '2027-02-01']) l.asignar('cine', p, 50);
  l.asignar('renta', '2027-03-01', 300);
  l.asignar('super', '2027-04-01', 350);
  l.asignar('viaje', '2027-04-01', 100);
  l.asignar('ajuste', '2027-04-01', -20);

  l.mov('si', 'saldo_inicial', '2027-01-01', [['ef', 1000]], [], { total: 1000 });
  // Enero
  l.mov('ing1', 'ingreso', '2027-01-05', [['ef', 500]], [], { total: 500 });
  l.mov('g-ene-super', 'gasto', '2027-01-10', [['ef', -80]], [{ cat: 'super', monto: 80 }], {
    comercio: 'SUPER SELECTOS ESCALON',
  });
  l.mov('g-ene-cine', 'gasto', '2027-01-12', [['vi', -60]], [{ cat: 'cine', monto: 60 }], {
    comercio: 'CINEPOLIS',
  });
  l.mov(
    'avance',
    'avance_efectivo',
    '2027-01-15',
    [
      ['vi', -50],
      ['ef', 50],
    ],
    [],
    { total: 50 },
  );
  // Febrero
  l.mov('ing2', 'ingreso', '2027-02-05', [['ef', 500]], [], { total: 500 });
  l.mov(
    'g-feb-super',
    'gasto',
    '2027-02-10',
    [['ef', -120]],
    [
      { cat: 'super', monto: 90 },
      { deudor: 'ana', monto: 30 },
    ],
    { comercio: 'SUPER SELECTOS STA ELENA' },
  );
  l.mov('g-feb-cine', 'gasto', '2027-02-14', [['vi', -40]], [{ cat: 'cine', monto: 40 }], {
    comercio: 'CINEPOLIS',
  });
  l.mov(
    'dev-cine',
    'devolucion',
    '2027-02-18',
    [['vi', 10]],
    [{ cat: 'cine', de: 'g-feb-cine-0', monto: 10 }],
  );
  l.mov('cobro', 'cobro', '2027-02-20', [['ef', 35]], [], { cobra: 'g-feb-super-1', total: 35 });
  // Marzo
  l.mov('ing3', 'ingreso', '2027-03-05', [['ef', 600]], [], { total: 600 });
  l.mov('g-mar-renta', 'gasto', '2027-03-10', [['ef', -300]], [{ cat: 'renta', monto: 300 }], {
    comercio: 'ARRENDADOR',
  });
  l.mov('g-mar-vieja', 'gasto', '2027-03-12', [['ef', -25]], [{ cat: 'vieja', monto: 25 }], {
    comercio: 'KIOSKO',
  });
  // Abril (activo): una compra por semana hasta hoy
  l.mov('g-abr-1', 'gasto', '2027-04-02', [['ef', -20]], [{ cat: 'super', monto: 20 }], {
    comercio: 'SUPER SELECTOS ESCALON',
  });
  l.mov('g-abr-2', 'gasto', '2027-04-09', [['ef', -35]], [{ cat: 'super', monto: 35 }], {
    comercio: 'SUPER SELECTOS ESCALON',
  });
  l.mov('g-abr-3', 'gasto', '2027-04-15', [['ef', -10]], [{ cat: 'super', monto: 10 }], {
    comercio: 'SUPER SELECTOS ESCALON',
  });
  ademas(l);
  return calcular(l.hechos(), f('2027-04-15'));
}

const m = (n: number) => c(n);
const inicio = (t: string) => f(t);

describe('PRU-DOM-REP', () => {
  const i = estado();

  const tablas = () => {
    // ultimos_3 con el período activo a la mitad: enero, febrero y marzo, sin abril (CA-60.4).
    const v = { ventana: 'ultimos_3' } as const;
    expect(tendencia(i, v)).toEqual([
      {
        periodo: inicio('2027-01-01'),
        ingresos: m(500),
        gastos: m(140),
        otrasEntradas: m(50),
        gastosPorGrupo: [
          { grupo: 'hogar', monto: m(80) },
          { grupo: 'ocio', monto: m(60) },
        ],
        asignado: m(150),
      },
      {
        periodo: inicio('2027-02-01'),
        ingresos: m(505),
        gastos: m(120),
        otrasEntradas: m(0),
        gastosPorGrupo: [
          { grupo: 'hogar', monto: m(90) },
          { grupo: 'ocio', monto: m(30) },
        ],
        asignado: m(150),
      },
      {
        periodo: inicio('2027-03-01'),
        ingresos: m(600),
        gastos: m(325),
        otrasEntradas: m(0),
        gastosPorGrupo: [
          { grupo: 'hogar', monto: m(300) },
          { grupo: 'ocio', monto: m(25) },
        ],
        asignado: m(400),
      },
    ]);

    // El excedente de $5.00 es ingreso y la restitución de $30.00 va aparte (CA-60.1); el avance es otra entrada.
    expect(ingresosGastos(i, v)).toEqual([
      {
        periodo: inicio('2027-01-01'),
        ingresos: m(500),
        gastos: m(140),
        diferencia: m(360),
        otrasEntradas: m(50),
        restituciones: m(0),
      },
      {
        periodo: inicio('2027-02-01'),
        ingresos: m(505),
        gastos: m(120),
        diferencia: m(385),
        otrasEntradas: m(0),
        restituciones: m(30),
      },
      {
        periodo: inicio('2027-03-01'),
        ingresos: m(600),
        gastos: m(325),
        diferencia: m(275),
        otrasEntradas: m(0),
        restituciones: m(0),
      },
    ]);

    expect(remanente(i, v)).toEqual([
      { periodo: inicio('2027-01-01'), neto: m(360), acumulado: m(360) },
      { periodo: inicio('2027-02-01'), neto: m(385), acumulado: m(745) },
      { periodo: inicio('2027-03-01'), neto: m(275), acumulado: m(1020) },
    ]);

    // Sin asignado el porcentaje es nulo y la diferencia es −gastado (CA-60.7); la archivada aparece (CA-60.9).
    const fila = (
      categoria: string,
      periodo: string,
      asignado: number,
      gastado: number,
      porcentaje: number | null,
    ) => ({
      categoria,
      periodo: inicio(periodo),
      asignado: m(asignado),
      gastado: m(gastado),
      diferencia: m(asignado - gastado),
      porcentaje,
    });
    expect(cumplimiento(i, v)).toEqual([
      fila('cine', '2027-01-01', 50, 60, 12000),
      fila('super', '2027-01-01', 100, 80, 8000),
      fila('cine', '2027-02-01', 50, 30, 6000),
      fila('super', '2027-02-01', 100, 90, 9000),
      fila('renta', '2027-03-01', 300, 300, 10000),
      fila('super', '2027-03-01', 100, 0, 0),
      fila('vieja', '2027-03-01', 0, 25, null),
    ]);

    // Σ positivos = $585.00; los porcentajes suman 10.000 (el redondeo deja 9.999 y el punto va a cine).
    const grupoDe = { super: 'hogar', renta: 'hogar', cine: 'ocio', vieja: 'ocio' };
    const cat = (categoria: keyof typeof grupoDe, gastado: number, porcentaje: number) => ({
      categoria,
      grupo: grupoDe[categoria],
      gastado: m(gastado),
      porcentaje,
    });
    const reporte = categorias(i, v);
    expect(reporte.categorias).toEqual([
      cat('renta', 300, 5128),
      cat('super', 170, 2906),
      cat('cine', 90, 1539),
      cat('vieja', 25, 427),
    ]);
    expect(reporte.categorias.reduce((s, x) => s + x.porcentaje, 0)).toBe(10_000);
    expect(reporte.conDevolucionNeta).toEqual([]);
    expect(categorias(i, { ...v, grupoId: id('ocio') }).categorias.map((x) => x.categoria)).toEqual(
      ['cine', 'vieja'],
    );

    // Patrimonio: la serie al fin de cada período y hoy coinciden con la posición neta (CA-60.8).
    const p = patrimonio(i, v);
    expect(p.serie).toEqual([
      { periodo: inicio('2027-01-01'), activos: m(1470), deudas: m(110), neto: m(1360) },
      { periodo: inicio('2027-02-01'), activos: m(1885), deudas: m(140), neto: m(1745) },
      { periodo: inicio('2027-03-01'), activos: m(2160), deudas: m(140), neto: m(2020) },
    ]);
    expect(p.hoy).toEqual(i.patrimonio);
    expect(p.hoy.total).toBe(m(1955));
  };

  const ventanaYFiltro = () => {
    // `actual` = el período activo, abril: 20 + 35 + 10 de supermercado.
    expect(tendencia(i).map((x) => [x.periodo, x.ingresos, x.gastos])).toEqual([
      [inicio('2027-04-01'), m(0), m(65)],
    ]);
    expect(ingresosGastos(i, { ventana: 'ultimos_1' }).map((x) => x.periodo)).toEqual([
      inicio('2027-03-01'),
    ]);
    // Solo cuentan los consumos y devoluciones con efecto en la tarjeta: cine, con la devolución D-1 neteada.
    const visa = { ventana: 'ultimos_3', cuentaIds: [id('vi')] } as const;
    expect(categorias(i, visa).categorias).toEqual([
      { categoria: 'cine', grupo: 'ocio', gastado: m(90), porcentaje: 10_000 },
    ]);
    expect(ingresosGastos(i, visa).map((x) => [x.ingresos, x.gastos, x.otrasEntradas])).toEqual([
      [m(0), m(60), m(50)],
      [m(0), m(30), m(0)],
      [m(0), m(0), m(0)],
    ]);
    // El patrimonio con K cuenta solo la tarjeta: su deuda al fin de febrero.
    expect(patrimonio(i, visa).serie.map((x) => x.neto)).toEqual([m(-110), m(-140), m(-140)]);
  };

  const existencia = () => {
    const periodo = (inicioP: string, fin: string) => ({
      inicio: f(inicioP),
      fin: f(fin),
      transicion: false,
    });
    const enero = periodo('2027-01-01', '2027-01-31');
    const marzo = periodo('2027-03-01', '2027-03-31');
    expect(existiaEn(i, id('cine'), enero)).toBe(true); // asignación y consumo
    expect(existiaEn(i, id('cine'), marzo)).toBe(false);
    expect(existiaEn(i, id('vieja'), marzo)).toBe(true); // archivada, pero con un consumo
    expect(existiaEn(i, id('vieja'), enero)).toBe(false);
    expect(existiaEn(i, id('renta'), enero)).toBe(false);
    expect(existiaEn(i, id('renta'), marzo)).toBe(true);
  };

  it('PRU-DOM-REP-101 [CA-60.1, CA-60.3, CA-60.4, CA-60.7, CA-60.8, CA-60.9, CA-60.10, CA-61.3] cada reporte base, con un estado conocido, da la misma tabla escrita a mano (04 §6.9.1 y §6.9.2, BE-40, REP-tendencia, REP-categorias, REP-ingresos_gastos, REP-remanente, REP-cumplimiento, REP-patrimonio)', () => {
    tablas();
    ventanaYFiltro();
    existencia();
  });

  it('PRU-DOM-REP-300 [FT-60] (CH-226, REP-tendencia) asignado por período es la Σ de Asig de las categorías normales, sin las de pago, en una ventana de 3 períodos (04 §6.9.2)', () => {
    // Una asignación a la categoría de pago de la tarjeta en cada período: no entra en el tope.
    const conPago = estado((l) => {
      for (const p of ['2027-01-01', '2027-02-01', '2027-03-01', '2027-04-01'])
        l.asignar('pago-vi', p, 75);
    });
    // Enero y febrero: súper 100 + cine 50; marzo: súper 100 + renta 300.
    expect(
      tendencia(conPago, { ventana: 'ultimos_3' }).map((x) => [x.periodo, x.asignado]),
    ).toEqual([
      [inicio('2027-01-01'), m(150)],
      [inicio('2027-02-01'), m(150)],
      [inicio('2027-03-01'), m(400)],
    ]);
    // Abril (actual): súper 350 + viaje 100 + la desasignación de ajuste, −20.
    expect(tendencia(conPago).map((x) => x.asignado)).toEqual([m(430)]);
  });

  it('PRU-DOM-REP-150 [FT-60] REP-categorias trae el total gastado para el centro de la dona y el monto de «Otras», con la ventana y los filtros (04 §6.9.2, CH-177)', () => {
    const v = { ventana: 'ultimos_3' } as const;
    // Renta 300 + súper 170 + cine 90 + vieja 25 = $585.00; 4 categorías caben en la dona, sin «Otras».
    expect(categorias(i, v)).toMatchObject({ total: m(585), montoOtras: m(0) });
    // Solo el grupo ocio: cine 90 + vieja 25.
    expect(categorias(i, { ...v, grupoId: id('ocio') })).toMatchObject({ total: m(115) });
    // Solo la tarjeta: cine 100 − la devolución D-1 de 10.
    expect(categorias(i, { ...v, cuentaIds: [id('vi')] })).toMatchObject({ total: m(90) });
    // Abril (actual): súper 20 + 35 + 10. Marzo (último cerrado): renta 300 + vieja 25; el súper sin gasto no suma.
    expect(categorias(i).total).toBe(m(65));
    expect(categorias(i, { ventana: 'ultimos_1' }).total).toBe(m(325));
  });

  it('PRU-DOM-REP-790 [FT-60, CA-60.4] (CH-251) el último período de la ventana da la cifra de Tendencia e Ingresos y gastos: marzo cerrado con ultimos_3, abril activo con actual y ninguno sin períodos cerrados', () => {
    expect(ultimoPeriodo(i, 'ultimos_3')).toMatchObject({
      inicio: inicio('2027-03-01'),
      fin: inicio('2027-03-31'),
      estado: 'cerrado',
    });
    expect(ultimoPeriodo(i)).toMatchObject({
      inicio: inicio('2027-04-01'),
      fin: inicio('2027-04-30'),
      estado: 'activo',
    });
    // Con hoy en el primer período del libro no hay ninguno cerrado.
    const temprano = calcular(new Libro().hechos(), f('2027-01-10'));
    expect(ultimoPeriodo(temprano, 'ultimos_6')).toBeUndefined();
  });

  it('PRU-DOM-REP-791 [FT-60, CA-60.7] (CH-251) Cumplimiento cuenta las categorías del último período de la ventana que se pasaron de lo asignado: en marzo solo la archivada sin asignado; en abril la desasignación sin gasto no cuenta', () => {
    // Marzo: renta 300/300, súper 100/0 y vieja 0/25.
    expect(resumenCumplimiento(i, { ventana: 'ultimos_3' })).toMatchObject({
      periodo: { inicio: inicio('2027-03-01'), estado: 'cerrado' },
      sePasaron: 1,
      categorias: 3,
    });
    // Abril: súper 350/65, viaje 100/0 y ajuste −20/0.
    expect(resumenCumplimiento(i)).toMatchObject({
      periodo: { inicio: inicio('2027-04-01'), estado: 'activo' },
      sePasaron: 0,
      categorias: 3,
    });
    // Un consumo de súper que pasa los $350.00 de abril.
    const pasado = estado((l) => {
      l.mov('g-abr-4', 'gasto', '2027-04-15', [['ef', -300]], [{ cat: 'super', monto: 300 }]);
    });
    expect(resumenCumplimiento(pasado)).toMatchObject({ sePasaron: 1, categorias: 3 });
  });

  it('PRU-DOM-REP-792 [FT-68] (CH-251) Flujo de efectivo: la variación es el saldo final del último período menos el saldo inicial del primero (06 §3.3)', () => {
    // Efectivo: $0.00 antes del 1 de enero, $1,885.00 al 28 de febrero, $2,160.00 al 31 de marzo y $2,095.00 hoy.
    expect(flujoEfectivo(i, { ventana: 'ultimos_3' }).variacion).toBe(m(2160));
    expect(flujoEfectivo(i, { ventana: 'ultimos_1' }).variacion).toBe(m(275));
    expect(flujoEfectivo(i).variacion).toBe(m(-65));
  });

  it('PRU-DOM-REP-793 [FT-62, CA-62.2] (CH-251) Realidad cuenta las categorías que se alejan de su promedio: súper va camino a más del doble de su promedio de $56.67', () => {
    const r = realidad(i);
    expect(r.alejadas).toBe(1);
    expect(r.hallazgos.filter((h) => h.tipo === 'promedio').map((h) => h.clave)).toEqual([
      'categoria:super',
    ]);
  });
});

describe('PRU-DOM-BAND', () => {
  const i = estado();
  const regla = (patron: string) => ({ id: id(`regla-${patron}`), patron });

  it('PRU-DOM-BAND-790 [FT-39, CA-39.1] (CH-251) «Coincide con» da los comercios de las transacciones que contienen el patrón, sin mayúsculas, distintos y del más reciente al más antiguo, hasta 3', () => {
    const r = coincidenciasDeReglas(i, [regla('selectos'), regla('CINE'), regla('zzz')]);
    expect(r.get(id('regla-selectos'))).toEqual([
      'SUPER SELECTOS ESCALON',
      'SUPER SELECTOS STA ELENA',
    ]);
    expect(r.get(id('regla-CINE'))).toEqual(['CINEPOLIS']);
    expect(r.get(id('regla-zzz'))).toEqual([]);
    const muchos = estado((l) => {
      for (const [k, sucursal] of ['A', 'B', 'C', 'D'].entries())
        l.mov(
          `g-${sucursal}`,
          'gasto',
          `2027-04-0${k + 1}`,
          [['ef', -1]],
          [{ cat: 'super', monto: 1 }],
          { comercio: `  PUMA   ${sucursal} ` },
        );
    });
    expect(coincidenciasDeReglas(muchos, [regla('puma')]).get(id('regla-puma'))).toEqual([
      'PUMA   D',
      'PUMA   C',
      'PUMA   B',
    ]);
  });
});
