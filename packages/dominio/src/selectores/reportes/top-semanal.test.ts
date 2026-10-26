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
import { gastoSemanal, topComercios } from './index';

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
function estado() {
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
  return calcular(l.hechos(), f('2027-04-15'));
}

const m = (n: number) => c(n);

describe('PRU-DOM-REP', () => {
  const i = estado();

  const top = () => {
    const v = { ventana: 'ultimos_3' } as const;
    const top = topComercios(i, [{ patron: 'SELECTOS' }], v);
    expect(top).toEqual([
      {
        clave: 'ARRENDADOR'.toLowerCase(),
        etiqueta: 'ARRENDADOR',
        porRegla: false,
        monto: m(300),
        frecuencia: 1,
        categoriaPrincipal: 'renta',
        variantes: [{ comercio: 'arrendador', monto: m(300), frecuencia: 1 }],
      },
      {
        clave: 'SELECTOS',
        etiqueta: 'SELECTOS',
        porRegla: true,
        monto: m(170),
        frecuencia: 2,
        categoriaPrincipal: 'super',
        variantes: [
          { comercio: 'super selectos sta elena', monto: m(90), frecuencia: 1 },
          { comercio: 'super selectos escalon', monto: m(80), frecuencia: 1 },
        ],
      },
      {
        clave: 'cinepolis',
        etiqueta: 'CINEPOLIS',
        porRegla: false,
        monto: m(90),
        frecuencia: 2,
        categoriaPrincipal: 'cine',
        variantes: [{ comercio: 'cinepolis', monto: m(90), frecuencia: 2 }],
      },
      {
        clave: 'kiosko',
        etiqueta: 'KIOSKO',
        porRegla: false,
        monto: m(25),
        frecuencia: 1,
        categoriaPrincipal: 'vieja',
        variantes: [{ comercio: 'kiosko', monto: m(25), frecuencia: 1 }],
      },
    ]);
    expect(
      topComercios(i, [{ patron: 'SELECTOS' }], { ...v, limite: 2 }).map((x) => x.clave),
    ).toEqual(['arrendador', 'SELECTOS']);
    // Sin la regla, cada variante es su propio comercio.
    expect(topComercios(i, [], v).map((x) => x.clave)).toEqual([
      'arrendador',
      'cinepolis',
      'super selectos sta elena',
      'super selectos escalon',
      'kiosko',
    ]);
  };

  const semanal = () => {
    const g = gastoSemanal(i);
    expect(g.periodo.inicio).toBe('2027-04-01');
    expect(g.categorias.map((x) => x.categoria)).toEqual(['super', 'viaje', 'ajuste']);
    const superc = g.categorias[0];
    if (superc === undefined) throw new Error('falta supermercado');
    expect(superc.semanas.map((s) => [s.k, s.dias, s.referencia, s.gasto, s.futura])).toEqual([
      [1, 7, m(81.67), m(20), false],
      [2, 7, m(81.66), m(35), false],
      [3, 7, m(81.67), m(10), false],
      [4, 7, m(81.67), m(0), true],
      [5, 2, m(23.33), m(0), true],
    ]);
    expect(superc.semanas.map((s) => s.referenciaAcumulada)).toEqual([
      m(81.67),
      m(163.33),
      m(245),
      m(326.67),
      m(350),
    ]);
    expect(superc.semanas.map((s) => s.gastoAcumulado)).toEqual([
      m(20),
      m(55),
      m(65),
      m(65),
      m(65),
    ]);
    // Hoy es el día 15: semana 3 en curso, con 10 de 81.67 de la referencia y 180.00 por debajo de lo acumulado.
    expect(superc.semanaActual).toEqual({ k: 3, porcentajeReferenciaBp: 1224 });
    expect(superc.diferenciaReferencia).toBe(m(180));
    // Compara con las mismas semanas de marzo, febrero y enero (los 3 cerrados en que existía), el más reciente primero.
    expect(superc.nueva).toBe(false);
    expect(superc.semanas[1]?.anteriores).toEqual([
      { periodo: '2027-03-01', gasto: m(0) },
      { periodo: '2027-02-01', gasto: m(90) },
      { periodo: '2027-01-01', gasto: m(80) },
    ]);
    // Febrero tiene 28 días: no tiene semana 5.
    expect(superc.semanas[4]?.anteriores.map((a) => a.periodo)).toEqual([
      '2027-03-01',
      '2027-01-01',
    ]);

    const [, viaje, ajuste] = g.categorias;
    expect(viaje?.nueva).toBe(true);
    expect(viaje?.semanas.every((s) => s.anteriores.length === 0)).toBe(true);
    // Asignado negativo: todas las referencias en cero y sin porcentaje (CA-61.2, CA-61.7).
    expect(ajuste?.semanas.map((s) => s.referencia)).toEqual([0, 0, 0, 0, 0]);
    expect(ajuste?.semanaActual?.porcentajeReferenciaBp).toBeNull();

    // Un período cerrado: sin semana actual ni diferencia, y con categorías elegidas aunque no existieran.
    const marzo = gastoSemanal(i, {
      periodoInicio: f('2027-03-01'),
      categoriaIds: [id('renta'), id('cine')],
    });
    expect(marzo.categorias.map((x) => [x.categoria, x.nueva, x.semanaActual])).toEqual([
      ['renta', true, undefined],
      ['cine', false, undefined],
    ]);
  };

  it('PRU-DOM-REP-102 [CA-60.6, CA-61.1, CA-61.2, CA-61.4, CA-61.6, CA-61.7] el top de comercios y el gasto semanal, con un estado conocido, dan la misma tabla escrita a mano (04 §6.9.2, §6.9.3 y §6.9.6, BE-40, BE-43, REP-top_comercios, REP-gasto_semanal)', () => {
    top();
    semanal();
  });
});
