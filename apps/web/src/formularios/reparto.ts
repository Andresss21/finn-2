// [CH-276] Los montos que proponen «¿Quién paga?» y «¿En qué categorías?» de Registrar gasto (C-45 §10, C-49 §2): partes
// iguales, porcentaje y «Lo que queda». PF-3 ampliado: la interfaz propone, cada monto se ve antes de guardar y viaja como la
// línea que la persona aceptó; el servidor sigue validando Σ líneas = total. Sin flotantes: solo las funciones de `Centavos`
// (ADR-21, el único módulo que divide). La primera fila es la propia (Vos, o la primera categoría): se lleva el resto.
import { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal } from '../formato/monto';
import { normalizarMontoEscrito } from './normalizar-monto';

export type ModoReparto = 'iguales' | 'porcentaje' | 'montos';

export interface FilaEscrita {
  readonly monto: string;
  readonly pct: string;
  /** «Lo que queda» (solo la primera fila, en Montos): vale lo que se reparte menos las demás. */
  readonly auto?: boolean;
}

export interface Reparto {
  readonly montos: readonly Centavos[];
  readonly suma: Centavos;
  /** Σ porcentajes, en centésimas de punto (10000 = 100 %); solo en Porcentaje. */
  readonly pctSuma: number;
  /** Alguna fila pasa de 100 %. */
  readonly pasaDe100: boolean;
}

const CIEN = 10000;
const sumar = (xs: readonly Centavos[]): Centavos => xs.reduce(Centavos.sumar, Centavos.cero);

/** Un monto escrito en centavos; vacío o inválido, 0 (lo marca quien valida). */
export function centavosEscritos(texto: string): Centavos {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? Centavos.desdeTexto(r.texto) : Centavos.cero;
}

/** Un porcentaje escrito («12.5») en centésimas de punto (1250); vacío, 0. */
export function centesimasEscritas(texto: string): number {
  const t = texto.replace(/\.$/, '');
  return /^\d{1,3}(\.\d{1,2})?$/.test(t) ? Centavos.desdeTexto(t) : 0;
}

/** Centésimas de punto a texto sin ceros de más: 8000 → «80», 1250 → «12.5». */
export const textoDeCentesimas = (h: number): string =>
  centavosATextoDecimal(Centavos.desdeEntero(h)).replace(/\.?0+$/, '');

/** El monto que viaja en la línea: «96.10». */
export const textoDeCentavos = (c: Centavos): string => centavosATextoDecimal(c);

export const diferencia = (a: Centavos, b: Centavos): Centavos => Centavos.restar(a, b);

/** Partes iguales: ⌊total / n⌋ cada una y el resto a la primera ($1,236.40 entre tres: $412.14, $412.13, $412.13). */
export function partesIguales(total: Centavos, n: number): Centavos[] {
  if (n < 1) return [];
  const unos = new Map(Array.from({ length: n }, (_, i) => [i, Centavos.desdeEntero(1)]));
  const parejo = Math.min(...Centavos.repartirPorRestoMayor(total, unos, (a, b) => a - b).values());
  const base = Centavos.desdeEntero(parejo);
  const otras = Array.from({ length: n - 1 }, () => base);
  return [Centavos.restar(total, sumar(otras)), ...otras];
}

/** Porcentaje con redondeo mitad hacia arriba; con Σ = 100 % la diferencia del redondeo va a la primera. */
export function porPorcentaje(total: Centavos, centesimas: readonly number[]): Centavos[] {
  const montos = centesimas.map((h) =>
    Centavos.proporcionMitadArriba(total, Math.min(h, CIEN), CIEN),
  );
  if (montos.length === 0 || centesimas.reduce((a, h) => a + h, 0) !== CIEN) return montos;
  return [Centavos.restar(total, sumar(montos.slice(1))), ...montos.slice(1)];
}

/** Qué parte del total es un monto, en centésimas de punto (para el «79.81 %» debajo de la cifra). */
export const centesimasDe = (monto: Centavos, total: Centavos): number =>
  total <= 0 ? 0 : Centavos.proporcionMitadArriba(Centavos.max(monto, Centavos.cero), CIEN, total);

/** Reparte `total` entre las filas según el modo. En Montos, la fila «Lo que queda» nunca baja de 0. */
export function repartir(
  total: Centavos,
  modo: ModoReparto,
  filas: readonly FilaEscrita[],
): Reparto {
  const base = Centavos.max(total, Centavos.cero);
  const pcts = filas.map((f) => centesimasEscritas(f.pct));
  let montos: Centavos[];
  if (modo === 'iguales') montos = partesIguales(base, filas.length);
  else if (modo === 'porcentaje') montos = porPorcentaje(base, pcts);
  else {
    const escritos = filas.map((f) => centavosEscritos(f.monto));
    const otras = sumar(escritos.slice(1));
    montos =
      filas[0]?.auto === true
        ? [Centavos.max(Centavos.restar(base, otras), Centavos.cero), ...escritos.slice(1)]
        : escritos;
  }
  return {
    montos,
    suma: sumar(montos),
    pctSuma: modo === 'porcentaje' ? pcts.reduce((a, h) => a + h, 0) : 0,
    pasaDe100: modo === 'porcentaje' && pcts.some((h) => h > CIEN),
  };
}

/** Al entrar en Porcentaje se propone lo mismo para cada fila, con el resto en la primera (50/50, 34/33/33). */
export const porcentajesIguales = (n: number): string[] =>
  partesIguales(Centavos.desdeEntero(CIEN), n).map(textoDeCentesimas);
