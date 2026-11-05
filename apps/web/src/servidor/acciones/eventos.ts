'use server';
// Server Actions de eventos de por cobrar (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP31 } from '@finn/aplicacion/operaciones/eventos';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const cobrarPorCobrar = accion(operacion(OP31));
