'use server';
// Server Actions de la bandeja (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import {
  aprobarTodos as lote,
  OP36,
  OP37,
  OP39,
  OP40,
  OP41,
  OP50,
  reprocesar,
} from '@finn/aplicacion/operaciones/bandeja';
import { accion } from '../accion.ts';
import { operacion, operacionLote } from '../operaciones.ts';

export const editarMovimiento = accion(operacion(OP36));
export const aprobarMovimiento = accion(operacion(OP37));
export const descartarMovimiento = accion(operacion(OP39));
export const resolverCoincidencia = accion(operacion(OP40));
export const reprocesarSms = accion(operacionLote(reprocesar)); // OP-49: natural, sin vista previa
export const aprobarTodos = accion(operacionLote(lote)); // OP-38: un `escribir()` por movimiento, sin vista previa
export const crearAMano = accion(operacion(OP50));
export const gestionarRegla = accion(operacion(OP41)); // OP-41: reglas de comercio (FT-39)
