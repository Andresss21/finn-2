'use server';
// Server Actions de la bandeja (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP36, OP37 } from '@finn/aplicacion/operaciones/bandeja';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const editarMovimiento = accion(operacion(OP36));
export const aprobarMovimiento = accion(operacion(OP37));
