// Mutantes de control del motor (07 §19.4, DP-26; los 4 de V7-03). Cada uno rompe una regla de 01 §4
// para comprobar que las pruebas la protegen: el nocturno corre PROP y ESC@motor con cada mutante y
// falla si alguno sobrevive (tools/ci/afecta.mjs).
//
// El nombre no se lee del entorno (el dominio es puro, ADR-21): lo inyecta Vitest como constante de
// compilación `__FINN_MUTANTE__` solo cuando el proceso de las pruebas tiene FINN_MUTANTE
// (vitest.config.ts). En la app nadie define la constante, así que `activo` es '' y ningún mutante
// existe fuera de las pruebas.

/** Los 4 mutantes de V7-03: arrastre negativo, traslado sin tope, sin orden D2 y cierre adelantado. */
export const MUTANTES = ['arrastre', 'traslado', 'orden', 'cierre'] as const;
export type Mutante = (typeof MUTANTES)[number];

declare const __FINN_MUTANTE__: string | undefined;

const activo: string = typeof __FINN_MUTANTE__ === 'string' ? __FINN_MUTANTE__ : '';

if (activo !== '' && !(MUTANTES as readonly string[]).includes(activo))
  throw new RangeError(`FINN_MUTANTE desconocido: ${activo} (${MUTANTES.join(', ')})`);

/** `true` solo si las pruebas corren con ese mutante (FINN_MUTANTE). */
export const mutante = (m: Mutante): boolean => activo === m;
