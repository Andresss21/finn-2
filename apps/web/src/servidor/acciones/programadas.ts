'use server';
// Server Actions de programadas (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { OP42 } from '@finn/aplicacion/operaciones/programadas';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';

export const gestionarProgramada = accion(operacion(OP42));
