'use server';
// Server Actions de transacciones (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import {
  OP20,
  OP21,
  OP22,
  OP23,
  OP24,
  OP25,
  OP26,
  OP27,
  OP28,
  OP29,
  OP30,
} from '@finn/aplicacion/operaciones/transacciones';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const registrarGasto = accion(operacion(OP20));
export const registrarIngreso = accion(operacion(OP21));
export const transferirEntreCuentas = accion(operacion(OP22));
export const pagarTarjeta = accion(operacion(OP23));
export const pagarCuotaPrestamo = accion(operacion(OP24));
export const registrarInversion = accion(operacion(OP25));
export const registrarDesembolso = accion(operacion(OP26));
export const registrarMovimientoTarjeta = accion(operacion(OP27));
export const editarTransaccion = accion(operacion(OP28));
export const eliminarTransaccion = accion(operacion(OP29));
export const cambiarEstadoBancario = accion(operacion(OP30));
