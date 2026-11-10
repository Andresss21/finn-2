// Índice de entrada escalonada (CH-220, C5): lo pone quien dibuja la lista, en el servidor y sin JavaScript. El retraso sale de
// `--n` por los tokens de `tokens.css`, con el tope de `--tope-escalonado` (8), en las utilidades `fz-*` de `globals.css`.
import type { CSSProperties } from 'react';

export function indice(n: number): CSSProperties {
  return { '--n': n } as CSSProperties;
}
