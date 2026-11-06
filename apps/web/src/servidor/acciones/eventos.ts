'use server';
// Server Actions de los eventos de una compra (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP31, OP32, OP33, OP34 } from '@finn/aplicacion/operaciones/eventos';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const cobrarPorCobrar = accion(operacion(OP31));
export const condonar = accion(operacion(OP32));
export const devolver = accion(operacion(OP33));
export const eliminarEvento = accion(operacion(OP34));
