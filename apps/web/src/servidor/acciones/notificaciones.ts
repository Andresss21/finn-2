'use server';
// Server Actions de las notificaciones (04 §2.2.2, FT-06 y FT-08): OPT-04 marcar como leídas, OPT-02 registrar o renovar la suscripción push y
// OPT-03 quitarla. Exigen sesión AAL2 con `getUser()` (04 §12.3) antes de tocar nada; la entrada cruda la valida su contrato
// y los errores salen sin detalle (el `endpoint` y las claves nunca van a un error ni a un registro).
import { revalidatePath } from 'next/cache';
import { relojDePrueba } from '@finn/aplicacion';
import { errorInterno } from '@finn/aplicacion/autenticacion';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { marcarNotificacionesLeidas } from '@finn/aplicacion/operaciones/notificaciones';
import { eliminarSuscripcionPush, registrarSuscripcionPush } from '@finn/aplicacion/push/enviar';
import { exigirSesionAal2 } from '../sesion.ts';

const opciones = () => ({ reloj: relojDePrueba() });

export async function registrarSuscripcion(cruda: unknown): Promise<ResultadoAccion<null>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const r = await registrarSuscripcionPush(cruda, opciones);
    if (r.ok) revalidatePath('/ajustes/notificaciones');
    return r;
  } catch {
    return { ok: false, error: errorInterno() };
  }
}

/** OPT-04 (FT-08): marcar como leídas las notificaciones de Inicio. Técnica y natural: repetirla marca 0, sin vista previa. */
export async function marcarLeidas(
  cruda: unknown,
): Promise<ResultadoAccion<{ readonly marcadas: number }>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const r = await marcarNotificacionesLeidas(cruda, opciones);
    if (r.ok) revalidatePath('/', 'layout');
    return r;
  } catch {
    return { ok: false, error: errorInterno() };
  }
}

export async function quitarSuscripcion(
  cruda: unknown,
): Promise<ResultadoAccion<{ readonly eliminadas: number }>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const r = await eliminarSuscripcionPush(cruda, opciones);
    if (r.ok) revalidatePath('/ajustes/notificaciones');
    return r;
  } catch {
    return { ok: false, error: errorInterno() };
  }
}
