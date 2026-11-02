'use server';
// Server Actions de grupos y categorías (04 §2.2.2): una línea por operación, con sesión AAL2 por `accion()`.
import { crearEnLote, OP07, OP08, OP13 } from '@finn/aplicacion/operaciones/categorias';
import { accion } from '../accion.ts';
import { operacion, operacionLote } from '../operaciones.ts';

export const crearEnEstructura = accion(operacion(OP07));
export const crearPlantilla = accion(operacionLote(crearEnLote));
export const editarEnEstructura = accion(operacion(OP08));
export const eliminarEnEstructura = accion(operacion(OP13));
