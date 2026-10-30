// Envoltorio de escritura (04 §2.2.2, BE-05): el único camino por el que la interfaz escribe. Cada archivo de
// `servidor/acciones/<area>.ts` ('use server') exporta una línea: `export const x = accion(operaciones.OP20_…)`.
// Este archivo NO lleva 'use server': solo los de `acciones/` exponen Server Actions.
import { revalidatePath } from 'next/cache';
import { errorDeValidacion, type ResultadoAccion } from '@finn/aplicacion/errores';
import type { ResultadoPrevisualizar } from '@finn/aplicacion/operaciones';
import { exigirSesionAal2 } from './sesion.ts';

/** Lo que `@finn/aplicacion` expone por cada OP/OPT (04 §2.3.1): `previsualizar(entrada)` y `confirmar(entrada)`. */
export interface OperacionAccionable<Salida> {
  previsualizar(entrada: unknown): Promise<ResultadoAccion<ResultadoPrevisualizar>>;
  confirmar(entrada: unknown): Promise<ResultadoAccion<Salida>>;
}

const MODOS = ['previsualizar', 'confirmar'] as const;

function separarModo(cruda: unknown): { modo: (typeof MODOS)[number] | null; resto: unknown } {
  if (typeof cruda !== 'object' || cruda === null) return { modo: null, resto: cruda };
  const { modo, ...resto } = cruda as Record<string, unknown>;
  const valido = MODOS.find((m) => m === modo);
  return { modo: valido ?? null, resto };
}

/**
 * Las cinco etapas de 04 §2.2.2: sesión AAL2; contrato Zod (dentro de `previsualizar`/`confirmar`); elegir según
 * `entrada.modo`; `revalidatePath('/', 'layout')` si se escribió; devolver `ResultadoAccion` sin lanzar nada hacia el
 * cliente (salvo el `redirect()` de Next, que ninguna de estas etapas usa).
 */
export function accion<Salida>(definicion: OperacionAccionable<Salida>) {
  return async (cruda: unknown): Promise<ResultadoAccion<ResultadoPrevisualizar | Salida>> => {
    const sesion = await exigirSesionAal2();
    if (!sesion.ok) return { ok: false, error: sesion.error };

    const { modo, resto } = separarModo(cruda);
    if (modo === null)
      return {
        ok: false,
        error: errorDeValidacion([
          { path: ['modo'], message: 'Indicá si querés previsualizar o confirmar.' },
        ]),
      };
    if (modo === 'previsualizar') return definicion.previsualizar(resto);

    const resultado = await definicion.confirmar(resto);
    if (resultado.ok) revalidatePath('/', 'layout');
    return resultado;
  };
}
