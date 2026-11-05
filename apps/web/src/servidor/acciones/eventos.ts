'use server';
// Server Actions de los eventos de una compra (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP33 } from '@finn/aplicacion/operaciones/eventos';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const devolver = accion(operacion(OP33));
