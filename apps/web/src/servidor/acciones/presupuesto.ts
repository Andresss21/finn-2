'use server';
// Server Actions de presupuesto (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP14 } from '@finn/aplicacion/operaciones/presupuesto';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const asignarEnCategoria = accion(operacion(OP14));
