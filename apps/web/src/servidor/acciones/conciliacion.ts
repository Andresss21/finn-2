'use server';
// Server Actions de la conciliación (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP53 } from '@finn/aplicacion/operaciones/conciliacion';
import { accion } from '../accion.ts';
import { agregar, iniciar, terminar } from '../conciliacion.ts';
import { operacion } from '../operaciones.ts';

export const verificarSaldo = accion(operacion(OP53));
export const iniciarConciliacion = accion(iniciar);
export const agregarDesdeEstado = accion(agregar);
export const terminarConciliacion = accion(terminar);
