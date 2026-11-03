'use server';
// Server Actions de transacciones (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP20, OP21, OP22, OP24, OP28 } from '@finn/aplicacion/operaciones/transacciones';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const registrarGasto = accion(operacion(OP20));
export const registrarIngreso = accion(operacion(OP21));
export const transferirEntreCuentas = accion(operacion(OP22));
export const pagarCuotaPrestamo = accion(operacion(OP24));
export const editarTransaccion = accion(operacion(OP28));
