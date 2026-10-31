// Catálogo de textos de la interfaz (05 §12.1, FE-23): un objeto `as const` por área.
// Cada ficha agrega su área acá; ningún texto literal va en JSX fuera de `src/textos/` (L8).
import { autenticacion } from './autenticacion.ts';
import { base } from './base.ts';
import { alcanceReserva, glosario } from './glosario.ts';
import { navegacion } from './navegacion.ts';

export { autenticacion, alcanceReserva, base, glosario, navegacion };

/** Áreas registradas, en un arreglo para que una prueba detecte nombres repetidos. */
export const areas = [
  ['autenticacion', autenticacion],
  ['base', base],
  ['glosario', glosario],
  ['alcanceReserva', alcanceReserva],
  ['navegacion', navegacion],
] as const;
