'use server';
// Server Actions de los eventos de una compra y de los deudores (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP33, OP34, OP52 } from '@finn/aplicacion/operaciones/eventos';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const devolver = accion(operacion(OP33));
export const eliminarEvento = accion(operacion(OP34));
export const renombrarDeudor = accion(operacion(OP52));
