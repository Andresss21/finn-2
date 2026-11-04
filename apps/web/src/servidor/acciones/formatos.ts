'use server';
// Server Actions de formatos bancarios e instituciones (04 §2.2.2, §8.7): OPT-05, OPT-06 y OPT-07. Son operaciones técnicas
// sin previsualización (no pasan por `accion()`): la sesión AAL2 con `getUser()` va primero y la entrada no se toca antes.
// El cliente manda `modo` y `esperado` (05 §4.3); los contratos son estrictos, así que se quitan acá.
import { revalidatePath } from 'next/cache';
import { errorInterno } from '@finn/aplicacion/autenticacion';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import {
  guardarFormatoBancario,
  guardarInstitucionBancaria,
  probarFormato,
  type SalidaFormato,
  type SalidaInstitucion,
  type SalidaProbar,
} from '@finn/aplicacion/operaciones/formatos';
import { ARBOL_CON_DATOS } from '../revalidar.ts';
import { exigirSesionAal2, sesionIdDeLaPeticion } from '../sesion.ts';

function sinControl(cruda: unknown): unknown {
  if (typeof cruda !== 'object' || cruda === null) return cruda;
  const resto = { ...(cruda as Record<string, unknown>) };
  delete resto['modo'];
  delete resto['esperado'];
  return resto;
}

/** Sesión primero; un fallo inesperado sale como `INTERNO`, sin el detalle. */
async function conSesion<T>(
  cruda: unknown,
  escribe: boolean,
  f: (entrada: unknown) => Promise<ResultadoAccion<T>>,
): Promise<ResultadoAccion<T>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const resultado = await f(sinControl(cruda));
    if (escribe && resultado.ok) revalidatePath(ARBOL_CON_DATOS, 'layout');
    return resultado;
  } catch {
    return { ok: false, error: errorInterno() };
  }
}

export async function guardarFormato(cruda: unknown): Promise<ResultadoAccion<SalidaFormato>> {
  return conSesion(cruda, true, async (entrada) =>
    guardarFormatoBancario(entrada, await sesionIdDeLaPeticion()),
  );
}

export async function probarFormatoContraSms(
  cruda: unknown,
): Promise<ResultadoAccion<SalidaProbar>> {
  return conSesion(cruda, false, (entrada) => probarFormato(entrada));
}

export async function guardarInstitucion(
  cruda: unknown,
): Promise<ResultadoAccion<SalidaInstitucion>> {
  return conSesion(cruda, true, (entrada) => guardarInstitucionBancaria(entrada));
}
