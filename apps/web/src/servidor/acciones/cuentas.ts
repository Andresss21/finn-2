'use server';
// Server Actions de cuentas (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP01, OP02, OP03, OP04, OP05, OP06, OP48 } from '@finn/aplicacion/operaciones/cuentas';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const crearCuenta = accion(operacion(OP01));
export const editarCuenta = accion(operacion(OP02));
export const ordenarCuentas = accion(operacion(OP03));
export const archivarCuenta = accion(operacion(OP04));
export const desarchivarCuenta = accion(operacion(OP05));
export const eliminarCuenta = accion(operacion(OP06));
export const editarCondicionesPrestamo = accion(operacion(OP48));
