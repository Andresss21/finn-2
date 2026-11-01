// Catálogo de textos de la interfaz (05 §12.1, FE-23): un objeto `as const` por área.
// Cada ficha agrega su área acá; ningún texto literal va en JSX fuera de `src/textos/` (L8).
import { autenticacion } from './autenticacion.ts';
import { base } from './base.ts';
import { cuentas } from './cuentas.ts';
import { cuentasNueva } from './cuentas-nueva.ts';
import { dominio } from './dominio.ts';
import { estados } from './estados.ts';
import { formularios } from './formularios.ts';
import { alcanceReserva, glosario } from './glosario.ts';
import { ingreso } from './ingreso.ts';
import { navegacion } from './navegacion.ts';

export {
  autenticacion,
  alcanceReserva,
  base,
  cuentas,
  cuentasNueva,
  dominio,
  estados,
  formularios,
  glosario,
  ingreso,
  navegacion,
};

/** Áreas registradas, en un arreglo para que una prueba detecte nombres repetidos. */
export const areas = [
  ['autenticacion', autenticacion],
  ['base', base],
  ['cuentas', cuentas],
  ['cuentasNueva', cuentasNueva],
  ['dominio', dominio],
  ['estados', estados],
  ['formularios', formularios],
  ['glosario', glosario],
  ['alcanceReserva', alcanceReserva],
  ['ingreso', ingreso],
  ['navegacion', navegacion],
] as const;
