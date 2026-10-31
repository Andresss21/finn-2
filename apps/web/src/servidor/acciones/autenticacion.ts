'use server';
// Server Actions del acceso previo a AAL2 (05 §9, CH-56): la lista cerrada de `indice.ts`, una línea por operación.
import { accionDeAcceso } from '../accion.ts';
import * as sesion from '../sesion.ts';

export const ingresar = accionDeAcceso(sesion.ingresar);
export const verificarFactor = accionDeAcceso(sesion.verificarFactor);
export const iniciarInscripcion = accionDeAcceso(sesion.iniciarInscripcion);
export const completarInscripcion = accionDeAcceso(sesion.completarInscripcion);
export const salir = accionDeAcceso(sesion.salir);
