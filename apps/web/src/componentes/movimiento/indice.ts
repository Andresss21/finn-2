// Índice de entrada escalonada (CH-220, C5): lo pone quien dibuja la lista, en el servidor y sin JavaScript. El retraso sale de
// `--n` por los tokens de `tokens.css`, en las utilidades `fz-*` de `globals.css`. El tope no es un tiempo sino una cantidad
// (CH-241, b): vive aquí, y `indice` la aplica; las reglas de `globals.css` que fijan `--n` a mano no pasan de este número.
import type { CSSProperties } from 'react';

/** Cantidad máxima de pasos del escalonado: del noveno elemento en adelante entran juntos. */
export const TOPE_ESCALONADO = 8;

export function indice(n: number): CSSProperties {
  return { '--n': Math.min(n, TOPE_ESCALONADO) } as CSSProperties;
}
