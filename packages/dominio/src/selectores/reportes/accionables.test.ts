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
import { realidad } from './index';

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
    l.categoria(n, k + 1, false);
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
