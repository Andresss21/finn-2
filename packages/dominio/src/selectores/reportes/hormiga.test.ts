import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  OcurrenciaResuelta,
  Programada,
  ProgramadaLinea,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { hormiga } from './index';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15, ciclo mensual: diciembre a marzo cerrados (4 períodos) y abril activo. Una sola
 * cuenta de efectivo `ef`; las filas se arman a mano, una por llamada.
 */
class Libro {
  readonly categorias: Categoria[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly programadas: Programada[] = [];
  readonly programadaLineas: ProgramadaLinea[] = [];
  readonly resueltas: OcurrenciaResuelta[] = [];

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
      asignaciones: [],
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: [],
      programadas: this.programadas,
      programada_lineas: this.programadaLineas,
      ocurrencias_resueltas: this.resueltas,
      conciliaciones: [],
    };
  }
}

const REGLAS = [{ patron: 'NETFLIX' }, { patron: 'SPOTIFY' }];

function estado() {
  const l = new Libro();
  for (const [k, n] of ['rest', 'cafes', 'comida', 'libros', 'papel', 'subs'].entries())
    l.categoria(n, k + 1);
  l.gasto('si', '2026-12-01', '', [['subs', 5000]]);
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

  return calcular(l.hechos(), f('2027-04-15'));
}

describe('PRU-DOM-REP', () => {
  const i = estado();

  it('PRU-DOM-REP-105 [CA-64.1, CA-64.3, CA-64.4] hormiga: 12 cafeterías dan un hallazgo de categoría; el solapamiento deja el de mayor total; 4 compras no alcanzan', () => {
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
});
