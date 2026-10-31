'use server';
// Server Action del flujo de prueba (TA-210): sesión AAL2 por `accion()` y solo con FINN_ENTORNO=pruebas por `eco.ts`.
import { accion } from '../accion.ts';
import { operacionEco } from '../eco.ts';

export const eco = accion(operacionEco);
