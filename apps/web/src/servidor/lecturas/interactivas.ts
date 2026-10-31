'use server';
// Lecturas interactivas (05 §4.12, CP-3): la lista cerrada de dos (L10). Cada exportación es una Server
// Action de solo lectura creada con `lectura()`: `exigirSesionLectura()` antes de tocar la entrada (PRU-SEG-ACCESO-001).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { sugerencia as consultarSugerencia } from '@finn/aplicacion/consultas/sugerencia';
import { lectura } from '../lectura.ts';

/** `consultas.sugerencia({ comercio })` (04 §6.14.3): la categoría sugerida mientras se escribe un comercio. */
export const sugerencia = lectura((entrada, deps) => consultarSugerencia(deps, entrada));

/** `consultas.formulario({ operacion: 'devolver', busqueda })` (04 §6.14.4): hasta 20 compras para devolver. */
export const buscarComprasDevolucion = lectura((entrada, deps) =>
  formulario(deps, { ...(entrada as object), operacion: 'devolver' }),
);
