// Definiciones comunes de los reportes (04 §6.9.1, BE-40 [Propio]): ventana W, filtro de cuentas K y
// las sumas por período que combinan los derivados de 01 §4. Solo lee la instantánea; no guarda nada.
import { gastado } from '../../calculo/actividad';
import type { ClaseDeReporte } from '../../calculo/clasificacion';
import { type Consumo, clasificar, consumos, type Devolucion } from '../../calculo/devoluciones';
import type { Periodo } from '../../calculo/periodos';
import type { Hechos, Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';

export type Ventana = 'actual' | 'ultimos_1' | 'ultimos_3' | 'ultimos_6' | 'ultimos_12';

/** Parámetros comunes de `consultas.reporte`: ventana y filtro de cuentas K (opcional). */
export interface FiltroDeReporte {
  readonly ventana?: Ventana;
  readonly cuentaIds?: readonly Uuid[];
}

/** Un intervalo de fechas con ambos extremos incluidos (un período o una semana). */
export type Rango = Pick<Periodo, 'inicio' | 'fin'>;

export const dentro = (r: Rango, f: FechaLocal): boolean => r.inicio <= f && f <= r.fin;
export const suma = (xs: readonly Centavos[]): Centavos => xs.reduce(Centavos.sumar, Centavos.cero);

/** W: `actual` = {A}; `ultimos_n` = los n períodos cerrados más recientes (los que haya). */
export function periodosDeVentana(i: Instantanea, ventana: Ventana = 'actual'): Periodo[] {
  if (ventana === 'actual') return [i.presupuesto.activo];
  const n = Number(ventana.slice('ultimos_'.length));
  return i.presupuesto.periodos.filter((p) => p.fin < i.hoy).slice(-n);
}

/**
 * num / den en puntos básicos, mitad hacia arriba (simétrico en negativos); `den` > 0. La división
 * es de `Centavos` (ADR-21).
 */
export function puntosBasicos(num: Centavos, den: Centavos): number {
  const p: number = Centavos.proporcionMitadArriba(
    Centavos.max(num, Centavos.negar(num)),
    10_000,
    den,
  );
  return num < 0 ? -p : p;
}

interface Contexto {
  readonly consumos: readonly Consumo[];
  readonly devoluciones: readonly Devolucion[];
  /** Cuentas con efecto de una transacción, de una línea o de una condonación (por id). */
  readonly cuentasDe: (id: Uuid) => ReadonlySet<Uuid>;
}

function cuentasPorId(h: Hechos): Contexto['cuentasDe'] {
  const deTx = new Map<Uuid, Set<Uuid>>();
  for (const e of h.efectos)
    deTx.set(e.transaccionId, (deTx.get(e.transaccionId) ?? new Set<Uuid>()).add(e.cuentaId));
  const txDeLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const txDeCondonacion = new Map(h.condonaciones.map((x) => [x.id, txDeLinea.get(x.lineaId)]));
  return (id) => {
    const tx = txDeLinea.get(id) ?? txDeCondonacion.get(id) ?? id;
    return deTx.get(tx) ?? new Set<Uuid>();
  };
}

const memoria = new WeakMap<Instantanea, Contexto>();

/** Lo que se deriva una vez por instantánea: consumos, devoluciones y cuentas por id. */
export function contexto(i: Instantanea): Contexto {
  let x = memoria.get(i);
  if (x === undefined) {
    x = {
      consumos: consumos(i.hechos, i.ciclo),
      devoluciones: clasificar(i.hechos, i.ciclo),
      cuentasDe: cuentasPorId(i.hechos),
    };
    memoria.set(i, x);
  }
  return x;
}

/** K como conjunto, o `undefined` si no hay filtro (lista ausente o vacía). */
export const conjuntoDeCuentas = (ids?: readonly Uuid[]): ReadonlySet<Uuid> | undefined =>
  ids === undefined || ids.length === 0 ? undefined : new Set(ids);

export const tocaK = (k: ReadonlySet<Uuid> | undefined, cuentas: ReadonlySet<Uuid>): boolean =>
  k === undefined || [...cuentas].some((c) => k.has(c));

export interface Medidor {
  readonly normales: Instantanea['hechos']['categorias'];
  /** Gastado(c, r): consumos netos menos aportes de devoluciones en r, restringido a K. */
  gastado(categoriaId: Uuid, r: Rango): Centavos;
  /** Si hubo un consumo o un aporte de la categoría en r (con K). */
  hayActividad(categoriaId: Uuid, r: Rango): boolean;
  /** Σ de las partidas de una clase de §4.13 con fecha en r (con K). */
  porClase(clase: ClaseDeReporte, r: Rango): Centavos;
  /** Gastos(p): Σ de Gastado de las categorías normales. */
  gastos(r: Rango): Centavos;
}

/** Las sumas de 04 §6.9.1 sobre una instantánea, con el filtro de cuentas K aplicado. */
export function medidor(i: Instantanea, cuentaIds?: readonly Uuid[]): Medidor {
  const k = conjuntoDeCuentas(cuentaIds);
  const cx = contexto(i);
  const cs = cx.consumos.filter((x) => k === undefined || k.has(x.cuentaId));
  const as = i.presupuesto.aportes.filter((x) => k === undefined || k.has(x.cuentaId));
  const partidas = i.clasificacion.partidas.filter((x) => tocaK(k, cx.cuentasDe(x.id)));
  const normales = i.hechos.categorias.filter((x) => x.clase === 'normal');
  const periodo = (r: Rango): Periodo => ({ inicio: r.inicio, fin: r.fin, transicion: false });
  const gastadoDe = (c: Uuid, r: Rango) => gastado(cs, as, c, periodo(r));
  return {
    normales,
    gastado: gastadoDe,
    hayActividad: (c, r) =>
      cs.some((x) => x.categoriaId === c && dentro(r, x.fecha)) ||
      as.some((x) => x.categoriaId === c && dentro(r, x.fecha)),
    porClase: (clase, r) =>
      suma(partidas.filter((x) => x.clase === clase && dentro(r, x.fecha)).map((x) => x.monto)),
    gastos: (r) => suma(normales.map((x) => gastadoDe(x.id, r))),
  };
}
