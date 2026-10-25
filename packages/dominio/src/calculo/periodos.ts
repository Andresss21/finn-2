// Períodos del presupuesto (01 §4.2 puntos 1 a 8; P7, M5, Q5, supuesto 15). Un período es un dato
// derivado de las vigencias del ciclo: nunca se guarda. El punto 9 ("rige desde" de una vigencia
// nueva) es de OP-19 (TA-136).
import type { VigenciaCiclo } from '../hechos';
import { FechaLocal } from '../valores/fecha-local';

/** Lo que el cálculo usa de una vigencia; `rigeDesde` es `null` solo en la primera (R₁ = −∞). */
export type VigenciaDeCiclo = Pick<VigenciaCiclo, 'diaInicio' | 'rigeDesde'>;

/** Una vigencia con su intervalo [Rᵢ, Rᵢ₊₁): `null` es −∞ en `rigeDesde` y +∞ en `rigeHasta`. */
export interface Tramo {
  readonly diaInicio: number;
  readonly rigeDesde: FechaLocal | null;
  readonly rigeHasta: FechaLocal | null;
}

/** Vigencias validadas y ordenadas por "rige desde" (R₁ < R₂ < … < Rₙ). */
export type Ciclo = readonly [Tramo, ...Tramo[]] & { readonly __marca: 'Ciclo' };

export type EstadoDePeriodo = 'cerrado' | 'activo' | 'futuro';

/** Período [inicio, fin], ambos incluidos; se identifica por su inicio (01 §1.1). */
export interface Periodo {
  readonly inicio: FechaLocal;
  readonly fin: FechaLocal;
  readonly transicion: boolean;
}

const { comparar, inicioDeMes, sumarDias, sumarMeses } = FechaLocal;
const menor = (a: FechaLocal, b: FechaLocal) => (a < b ? a : b);
const mayor = (a: FechaLocal, b: FechaLocal) => (a > b ? a : b);

/**
 * Valida y ordena las vigencias: al menos una, exactamente una sin "rige desde" (la primera),
 * los demás "rige desde" distintos y cada día de inicio entero entre 1 y 31.
 */
export function ciclo(vigencias: readonly VigenciaDeCiclo[]): Ciclo {
  const primeras = vigencias.filter((v) => v.rigeDesde === null);
  const [primera] = primeras;
  if (primera === undefined || primeras.length !== 1)
    throw new RangeError(`se esperaba una sola vigencia sin "rige desde"; hay ${primeras.length}`);
  for (const v of vigencias)
    if (!Number.isInteger(v.diaInicio) || v.diaInicio < 1 || v.diaInicio > 31)
      throw new RangeError(`día de inicio fuera de 1–31: ${v.diaInicio}`);
  const resto = vigencias
    .flatMap((v) => (v.rigeDesde === null ? [] : [{ ...v, rigeDesde: v.rigeDesde }]))
    .sort((a, b) => comparar(a.rigeDesde, b.rigeDesde));
  resto.forEach((v, i) => {
    if (i > 0 && v.rigeDesde === resto[i - 1]?.rigeDesde)
      throw new RangeError(`dos vigencias rigen desde ${v.rigeDesde}`);
  });
  const desdes = [null, ...resto.map((v) => v.rigeDesde)];
  const tramo = (v: VigenciaDeCiclo, i: number): Tramo => ({
    diaInicio: v.diaInicio,
    rigeDesde: desdes[i] ?? null,
    rigeHasta: desdes[i + 1] ?? null,
  });
  return [tramo(primera, 0), ...resto.map((v, i) => tramo(v, i + 1))] as unknown as Ciclo;
}

/** La vigencia que rige la fecha: Rᵢ ≤ f < Rᵢ₊₁ (el ciclo está ordenado). */
const vigenciaDe = (c: Ciclo, f: FechaLocal): Tramo =>
  c.reduce((elegida, t) => (t.rigeDesde !== null && t.rigeDesde <= f ? t : elegida), c[0]);

/**
 * Punto 2: inicios de la vigencia `i` que caen en [desde, hasta]: Rᵢ (si i ≥ 2) más cada
 * IM(m, dᵢ) con Rᵢ < IM(m, dᵢ) < Rᵢ₊₁. `i` cuenta desde 0: V₁ es la vigencia 0 del ciclo.
 */
export function iniciosDeVigencia(
  c: Ciclo,
  i: number,
  desde: FechaLocal,
  hasta: FechaLocal,
): FechaLocal[] {
  const v = c[i];
  if (v === undefined) throw new RangeError(`no hay vigencia ${i}`);
  const { rigeDesde: r, rigeHasta: tope } = v;
  const inicios: FechaLocal[] = [];
  if (r !== null && desde <= r && r <= hasta) inicios.push(r);
  const primerMes = inicioDeMes(r === null ? desde : mayor(desde, r), 1);
  for (let m = primerMes; ; m = sumarMeses(m, 1)) {
    const im = inicioDeMes(m, v.diaInicio);
    if (im > hasta || (tope !== null && im >= tope)) break;
    if (im >= desde && (r === null || im > r)) inicios.push(im);
  }
  return inicios;
}

/** Punto 3: la unión ordenada de los inicios de todas las vigencias, en [desde, hasta]. */
export function iniciosDePeriodo(c: Ciclo, desde: FechaLocal, hasta: FechaLocal): FechaLocal[] {
  // Cada vigencia genera inicios solo dentro de [Rᵢ, Rᵢ₊₁): concatenarlas en orden ya es la unión ordenada.
  return c.flatMap((_, i) => iniciosDeVigencia(c, i, desde, hasta));
}

/**
 * Puntos 4 a 6: el único período que contiene `f`. Su inicio es el último de la vigencia que rige
 * `f` que no pasa de `f`; su fin, el día anterior al inicio siguiente (s′ − 1 día).
 */
export function periodoDe(c: Ciclo, f: FechaLocal): Periodo {
  const { diaInicio, rigeDesde: r, rigeHasta: tope } = vigenciaDe(c, f);
  const deEsteMes = inicioDeMes(f, diaInicio);
  const previo = deEsteMes <= f ? deEsteMes : inicioDeMes(sumarMeses(deEsteMes, -1), diaInicio);
  const proximo = deEsteMes > f ? deEsteMes : inicioDeMes(sumarMeses(deEsteMes, 1), diaInicio);
  const inicio = r === null ? previo : mayor(previo, r);
  const siguiente = tope === null ? proximo : menor(proximo, tope);
  // Punto 5: de transición si empieza en Rᵢ (i ≥ 2) y Rᵢ no es un IM(m, dᵢ).
  const transicion = inicio === r && inicioDeMes(r, diaInicio) !== r;
  return { inicio, fin: sumarDias(siguiente, -1), transicion };
}

/** Los períodos que tocan [desde, hasta], en orden; vacío si `desde` es posterior a `hasta`. */
export function periodosEntre(c: Ciclo, desde: FechaLocal, hasta: FechaLocal): Periodo[] {
  const periodos: Periodo[] = [];
  for (let f = desde; f <= hasta;) {
    const p = periodoDe(c, f);
    periodos.push(p);
    f = sumarDias(p.fin, 1);
  }
  return periodos;
}

/** Punto 7: cerrado si fin < hoy; activo si inicio ≤ hoy ≤ fin; futuro si inicio > hoy. */
export function estadoDe(p: Periodo, hoy: FechaLocal): EstadoDePeriodo {
  if (p.fin < hoy) return 'cerrado';
  return p.inicio > hoy ? 'futuro' : 'activo';
}

/** Punto 8: dur(p) = fin − inicio + 1, en días. */
export const duracion = (p: Periodo): number => FechaLocal.diasEntre(p.inicio, p.fin) + 1;
