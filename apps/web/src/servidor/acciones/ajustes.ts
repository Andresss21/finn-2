'use server';
// Server Actions de Ajustes (04 §2.2.2): OPT-01, rotar el token del webhook (FT-03). Es una operación técnica sin entrada ni
// previsualización: exige sesión AAL2 con `getUser()` (04 §12.3) antes de tocar nada. El token en claro sale una sola vez, en
// el `valor` de la respuesta; nunca va a un error, a un registro ni a una URL.
import { revalidatePath } from 'next/cache';
import { errorInterno } from '@finn/aplicacion/autenticacion';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { rotarToken } from '@finn/aplicacion/sms/token';
import { exigirSesionAal2 } from '../sesion.ts';

export async function rotarTokenWebhook(): Promise<ResultadoAccion<{ readonly token: string }>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const { token } = await rotarToken();
    revalidatePath('/', 'layout');
    return { ok: true, valor: { token }, yaAplicada: false, avisos: [] };
  } catch {
    // Sin el detalle: ni el mensaje del error ni la pila pueden llevar datos de la operación
    return { ok: false, error: errorInterno() };
  }
}
