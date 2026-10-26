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
  Meta,
  OcurrenciaResuelta,
  Programada,
  ProgramadaLinea,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { claveDeComercio, patronesOrdenados } from './agrupacion';
import { hormiga, realidad, suscripciones } from './index';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15, ciclo mensual: diciembre a marzo cerrados (4 períodos) y abril activo. Una sola
 * cuenta de efectivo `ef`; las filas se arman a mano, una por llamada.
 */
class Libro {
  readonly categorias: Categoria[] = [];
  readonly asignaciones: Asignacion[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly programadas: Programada[] = [];
  readonly programadaLineas: ProgramadaLinea[] = [];
  readonly resueltas: OcurrenciaResuelta[] = [];
  readonly metas: Meta[] = [];

  categoria(nombre: string, orden: number, archivada = false) {
    this.categorias.push({
      id: id(nombre),
      grupoId: id('g'),
      nombre,
      orden,
      clase: 'normal',
      tarjetaId: null,
      archivada,
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

  /** Un gasto en efectivo con una línea por (categoría, monto). */
  gasto(tx: string, fecha: string, comercio: string, lineas: [string, number][]) {
    const total = lineas.reduce((s, [, m]) => s + m, 0);
    this.transacciones.push({
      id: id(tx),
      tipo: tx === 'si' ? 'saldo_inicial' : 'gasto',
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(this.transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio,
      total: c(total),
      lineaCobradaId: null,
    } as Transaccion);
    this.efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id('ef'),
      monto: c(tx === 'si' ? total : -total),
      interes: null,
      seguro: null,
    } as Efecto);
    lineas.forEach(([cat, monto], k) =>
      this.lineas.push({
        id: id(`${tx}-${k}`),
        transaccionId: id(tx),
        orden: k + 1,
        monto: c(monto),
        categoriaId: id(cat),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea),
    );
  }

  programada(
    n: string,
    comercio: string,
    monto: number,
    extra: Partial<Programada> = {},
    categoria = 'subs',
  ) {
    this.programadas.push({
      id: id(n),
      tipo: 'gasto',
      cuentaId: id('ef'),
      cuentaDestinoId: null,
      comercio,
      monto: c(monto),
      tolerancia: c(0),
      frecuencia: 'mensual',
      frecuenciaDias: null,
      primeraFecha: f('2026-01-01'),
      fechaFin: null,
      registroAutomatico: false,
      activa: true,
      ...extra,
    } as Programada);
    this.programadaLineas.push({
      id: id(`pl-${n}`),
      programadaId: id(n),
      orden: 1,
      monto: c(monto),
      categoriaId: id(categoria),
    } as ProgramadaLinea);
  }

  hechos(): Hechos {
    return {
      vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
      cuentas: [
        { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
      ] as Cuenta[],
      tarjetas: [],
      prestamos: [],
      inversiones: [],
      grupos: [
        { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      ] as Grupo[],
      categorias: this.categorias,
      asignaciones: this.asignaciones,
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: this.metas,
      programadas: this.programadas,
      programada_lineas: this.programadaLineas,
      ocurrencias_resueltas: this.resueltas,
      conciliaciones: [],
    };
  }
}

const MESES = ['2027-01', '2027-02', '2027-03'] as const;
const REGLAS = [{ patron: 'NETFLIX' }, { patron: 'SPOTIFY' }];

function estado() {
  const l = new Libro();
  for (const [k, n] of [
    'rest',
    'gas',
    'sobra',
    'fondo',
    'nueva',
    'cafes',
    'comida',
    'libros',
    'papel',
    'subs',
    'vieja',
  ].entries())
    l.categoria(n, k + 1, n === 'vieja');
  l.gasto('si', '2026-12-01', '', [['subs', 5000]]);

  // Realidad (CA-63): 150 asignados y 180, 175 y 185 gastados.
  MESES.forEach((m, k) => {
    for (const cat of ['rest', 'gas']) {
      l.asignar(cat, `${m}-01`, 150);
      l.gasto(`${cat}-${m}`, `${m}-10`, `REST ${cat} ${k}`, [[cat, [180, 175, 185][k] as number]]);
    }
    l.asignar('sobra', `${m}-01`, 100);
    l.gasto(`sobra-${m}`, `${m}-11`, 'OTRO', [['sobra', [40, 50, 30][k] as number]]);
    l.asignar('fondo', `${m}-01`, 50);
  });
  for (const m of MESES.slice(1)) {
    l.asignar('nueva', `${m}-01`, 100);
    l.gasto(`nueva-${m}`, `${m}-12`, 'OTRO', [['nueva', 300]]);
  }
  l.asignar('rest', '2027-04-01', 100);
  l.asignar('gas', '2027-04-01', 100);
  l.metas.push({
    id: id('meta-gas'),
    categoriaId: id('gas'),
    tipo: 'mensual',
    modo: 'acumular',
    monto: c(150),
    fechaObjetivo: null,
    fechaCreacion: f('2027-01-01'),
  } as Meta);

  // Hormiga (abril): 12 cafés en 12 cafeterías, más uno que resolvió una programada.
  for (let k = 1; k <= 12; k++)
    l.gasto(`cafe-${k}`, `2027-04-${String(k).padStart(2, '0')}`, `CAFE ${k}`, [['cafes', 5.34]]);
  l.gasto('cafe-prog', '2027-04-10', 'CAFE PROG', [['cafes', 9]]);
  l.programada('p-cafe', 'CAFE PROG', 9, { primeraFecha: f('2027-04-10') }, 'cafes');
  l.resueltas.push({
    id: id('or-cafe'),
    programadaId: id('p-cafe'),
    fechaEsperada: f('2027-04-10'),
    estado: 'registrada',
    transaccionId: id('cafe-prog'),
  } as OcurrenciaResuelta);
  // Solapamiento: 5 compras en un comercio y una sola categoría (empatan: gana la categoría).
  for (let k = 1; k <= 5; k++) l.gasto(`pup-${k}`, `2027-04-0${k}`, 'PUPUSERIA', [['comida', 5]]);
  // Un comercio repartido en dos categorías: el comercio suma 30, cada categoría menos de 20.
  for (let k = 1; k <= 6; k++)
    l.gasto(`lib-${k}`, `2027-04-0${k}`, 'LIBRERIA', [
      ['libros', 3],
      ['papel', 2],
    ]);
  // Solo 4 compras en un comercio.
  for (let k = 1; k <= 4; k++) l.gasto(`kio-${k}`, `2027-04-1${k}`, 'KIOSKO', [['rest', 3]]);

  // Suscripciones (dic a mar). Netflix: días 17, 17 y 18 con variantes del comercio.
  ['NETFLIX.COM 123', 'netflix', '  NETFLIX US '].forEach((v, k) => {
    l.gasto(`nf-${k}`, `${MESES[k]}-${k === 2 ? 18 : 17}`, v, [['subs', 15.49]]);
  });
  // Spotify: programada desactivada con una resolución y otra sin resoluciones.
  MESES.forEach((m, k) => {
    l.gasto(`sp-${k}`, `${m}-0${k === 2 ? 6 : 5}`, 'SPOTIFY AB', [['subs', 9.99]]);
  });
  l.programada('sp-con', 'SPOTIFY', 9.99, { activa: false, primeraFecha: f('2026-06-01') });
  l.programada('sp-sin', 'SPOTIFY OLD', 9.99, { activa: false, primeraFecha: f('2026-09-01') });
  l.resueltas.push({
    id: id('or-sp'),
    programadaId: id('sp-con'),
    fechaEsperada: f('2026-07-01'),
    estado: 'registrada',
    transaccionId: null,
  } as OcurrenciaResuelta);
  // Gimnasio: categoría archivada, 30, 30 y 32.
  MESES.forEach((m, k) => {
    l.gasto(`gym-${k}`, `${m}-10`, 'GYM', [['vieja', [30, 30, 32][k] as number]]);
  });
  // HBO: cobros en solo 2 de los 4 períodos.
  for (const m of MESES.slice(0, 2)) l.gasto(`hbo-${m}`, `${m}-20`, 'HBO', [['subs', 12.99]]);
  // Disney: ya programada, no se detecta; una programada cada 10 días se convierte a mensual.
  MESES.forEach((m) => {
    l.gasto(`di-${m}`, `${m}-03`, 'DISNEY', [['subs', 7.99]]);
  });
  l.programada('p-disney', 'Disney', 7.99);
  l.programada('p-luz', 'CAESS', 20, { frecuencia: 'cada_n_dias', frecuenciaDias: 10 });
  return calcular(l.hechos(), f('2027-04-15'));
}

describe('PRU-DOM-REP', () => {
  const i = estado();

  it('PRU-DOM-REP-104 [CA-63.1, CA-63.2, CA-63.4, CA-63.5] realidad: sugerencia al dólar entero, meta, fondo sin gasto y 2 períodos sin hallazgo', () => {
    const r = realidad(i);
    const por = (clave: string) => r.hallazgos.filter((x) => x.clave === clave);
    expect(por('categoria:rest').map((x) => x.tipo)).toEqual(['promedio', 'realidad']);
    expect(por('categoria:rest')[1]).toMatchObject({
      causa: 'pasas',
      promedioGastado: c(180),
      asignadoPromedio: c(150),
      sugerido: c(180),
      impacto: c(80),
      accion: { tipo: 'asignar', montoNuevo: c(180) },
    });
    // Con una meta mensual, la propuesta edita la meta y no lo asignado.
    expect(por('categoria:gas')[1]).toMatchObject({
      accion: { tipo: 'meta', metaId: 'meta-gas', monto: c(180) },
    });
    expect(por('categoria:sobra')[0]).toMatchObject({ causa: 'sobra', sugerido: c(40) });
    expect(por('categoria:fondo')).toEqual([]);
    expect(por('categoria:nueva')).toEqual([]);
    const cat = (n: string) => r.categorias.find((x) => x.categoria.id === n);
    expect(cat('nueva')).toMatchObject({ promedioGastado: null, sugerido: null, variacion: null });
    expect(cat('rest')?.periodos.map((x) => [x.periodo, x.asignado, x.gastado])).toEqual([
      [f('2027-01-01'), c(150), c(180)],
      [f('2027-02-01'), c(150), c(175)],
      [f('2027-03-01'), c(150), c(185)],
    ]);
    // Comparación con el promedio: abril sin gasto frente a un promedio de 180.
    expect(
      r.hallazgos.find((x) => x.tipo === 'promedio' && x.clave === 'categoria:gas'),
    ).toMatchObject({
      gasto: c(0),
      promedio: c(180),
      variacion: -10_000,
    });
    // Orden: impacto descendente.
    expect(r.hallazgos.map((x) => x.impacto)).toEqual(
      [...r.hallazgos.map((x) => x.impacto)].sort((a, b) => b - a),
    );
  });

  it('PRU-DOM-REP-104 [CA-64.1, CA-64.3, CA-64.4] hormiga: 12 cafeterías dan un hallazgo de categoría; el solapamiento deja el de mayor total; 4 compras no alcanzan', () => {
    const r = hormiga(i, REGLAS);
    expect(r.periodo.inicio).toBe('2027-04-01');
    expect(r.navegacion).toEqual({ anterior: f('2027-03-01') });
    expect(r.hallazgos.map((x) => [x.clave, x.agrupacion, x.compras, x.total])).toEqual(
      [
        ['comercio:libreria', 'comercio', 6, c(30)],
        ['categoria:comida', 'categoria', 5, c(25)],
        ['categoria:cafes', 'categoria', 12, c(64.08)],
      ].sort((a, b) => (b[3] as number) - (a[3] as number)),
    );
    const cafes = r.hallazgos.find((x) => x.clave === 'categoria:cafes');
    expect(cafes).toMatchObject({
      etiqueta: 'cafes',
      enlace: {
        pantalla: 'actividad',
        categoriaId: 'cafes',
        desde: f('2027-04-01'),
        hasta: f('2027-04-30'),
        montoHasta: c(10),
      },
    });
    expect(r.hallazgos.find((x) => x.clave === 'comercio:libreria')?.enlace).toMatchObject({
      texto: 'LIBRERIA',
    });
    // Los 4 de KIOSKO forman un grupo (al menos 2 compras) sin hallazgo; con 5 de PUPUSERIA empatan.
    expect(r.grupos.find((x) => x.clave === 'comercio:kiosko')).toMatchObject({
      compras: 4,
      total: c(12),
      categoriaPrincipal: { id: 'rest' },
    });
    expect(r.hallazgos.some((x) => x.clave === 'comercio:kiosko')).toBe(false);
    expect(r.grupos.some((x) => x.clave === 'comercio:pupuseria')).toBe(true);
    expect(r.grupos.map((x) => x.total)).toEqual(
      [...r.grupos.map((x) => x.total)].sort((a, b) => b - a),
    );
    // Un período cerrado sin compras pequeñas; el filtro de cuentas deja fuera todo.
    expect(hormiga(i, REGLAS, { periodo: f('2027-03-01') }).navegacion).toEqual({
      anterior: f('2027-02-01'),
      siguiente: f('2027-04-01'),
    });
    expect(hormiga(i, REGLAS, { cuentaIds: [id('otra')] }).grupos).toEqual([]);
  });

  it('PRU-DOM-REP-104 [CA-65.1, CA-65.3, CA-65.4] suscripciones: la clave de BE-43 une las variantes, reactiva la programada desactivada y exige 3 de 4 períodos', () => {
    const r = suscripciones(i, REGLAS);
    expect(r.suficiente).toBe(true);
    expect(
      r.detectadas.map((x) => [x.clave, x.mensual, x.anual, x.dia, x.periodosConCobro]),
    ).toEqual(
      [
        ['GYM'.toLowerCase(), c(30), c(360), 10, 3],
        ['NETFLIX', c(15.49), c(185.88), 17, 3],
        ['SPOTIFY', c(9.99), c(119.88), 5, 3],
      ].sort((a, b) => (b[1] as number) - (a[1] as number)),
    );
    const accion = (clave: string) =>
      r.hallazgos.find((x) => x.clave === `comercio:${clave}`)?.accion;
    expect(accion('NETFLIX')).toEqual({
      tipo: 'programar',
      valores: {
        cuentaId: 'ef',
        comercio: 'NETFLIX',
        monto: c(15.49),
        tolerancia: c(0),
        frecuencia: 'mensual',
        primeraFecha: f('2027-04-17'),
        categoriaId: 'subs',
        registroAutomatico: false,
      },
    });
    // Reactiva la de la resolución más reciente, no la que nunca se resolvió.
    expect(accion('SPOTIFY')).toEqual({ tipo: 'reactivar', programadaId: 'sp-con' });
    expect(r.detectadas.find((x) => x.clave === 'SPOTIFY')?.programadaDesactivada).toEqual({
      id: 'sp-con',
      nombre: 'SPOTIFY',
    });
    // Categoría archivada: abre el flujo; la tolerancia es la mayor diferencia observada.
    expect(accion('gym')).toMatchObject({
      tipo: 'abrir_flujo',
      valores: { tolerancia: c(2), categoriaId: 'vieja', monto: c(30) },
    });
    // Disney ya está programada, HBO solo cobró en 2 períodos.
    expect(r.detectadas.some((x) => /disney|hbo/i.test(x.clave))).toBe(false);
    expect(r.programadas.map((x) => [x.programada.id, x.mensual, x.anual])).toEqual(
      [
        ['p-cafe', c(9), c(108)],
        ['p-disney', c(7.99), c(95.88)],
        ['p-luz', c(60.83), c(730)],
      ].sort((a, b) => (b[1] as number) - (a[1] as number)),
    );
    expect(r.hallazgos.map((x) => x.impacto)).toEqual([c(30), c(15.49), c(9.99)]);
  });

  it('PRU-DOM-REP-104 [CA-65.4] suscripciones: con menos de 4 períodos cerrados no se detecta nada', () => {
    const l = new Libro();
    l.categoria('subs', 1);
    l.gasto('si', '2027-02-01', '', [['subs', 100]]);
    l.programada('p', 'X', 5, { frecuencia: 'semanal' });
    const r = suscripciones(calcular(l.hechos(), f('2027-04-15')), []);
    expect(r).toMatchObject({ suficiente: false, detectadas: [], hallazgos: [] });
    expect(r.programadas[0]).toMatchObject({ mensual: c(21.67), anual: c(260) });
  });

  it('PRU-DOM-REP-104 [CA-61.7] la clave de agrupación: el patrón más largo gana y las variantes se normalizan', () => {
    const patrones = patronesOrdenados([{ patron: 'SUPER' }, { patron: 'SUPER SELECTOS' }]);
    expect(claveDeComercio(patrones, ' Super  Selectos Escalon ')).toMatchObject({
      clave: 'SUPER SELECTOS',
      porRegla: true,
    });
    expect(claveDeComercio(patrones, null)).toMatchObject({
      clave: '(sin comercio)',
      porRegla: false,
    });
    expect(claveDeComercio([], 'Café  X')).toMatchObject({ clave: 'café x', escrito: 'Café  X' });
  });
});
