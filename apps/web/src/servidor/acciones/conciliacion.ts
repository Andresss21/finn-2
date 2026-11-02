'use server';
// Server Actions de la conciliación (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP53 } from '@finn/aplicacion/operaciones/conciliacion';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const verificarSaldo = accion(operacion(OP53));
