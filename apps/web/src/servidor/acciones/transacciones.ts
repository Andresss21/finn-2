'use server';
// Server Actions de transacciones (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP21, OP22 } from '@finn/aplicacion/operaciones/transacciones';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const registrarIngreso = accion(operacion(OP21));
export const transferirEntreCuentas = accion(operacion(OP22));
