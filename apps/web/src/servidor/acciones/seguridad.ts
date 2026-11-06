'use server';
// Server Actions de Ajustes > Seguridad (FT-74; 05 §9, CH-56): con `accion()`, o sea AAL2 y `getUser()`. Sin vista previa:
// `operacionLote` solo confirma. `salir`, que no exige AAL2, vive en `autenticacion.ts`.
import { accion } from '../accion.ts';
import { operacionLote } from '../operaciones.ts';
import * as sesion from '../sesion.ts';

export const quitarFactor = accion(operacionLote((cruda) => sesion.quitarFactor(cruda)));
export const cerrarOtrasSesiones = accion(
  operacionLote((cruda) => sesion.cerrarOtrasSesiones(cruda)),
);
