'use server';
// Server Actions de Ajustes (04 §2.2.2): «Ejecutar tareas ahora» (FT-76), OP-19, cambiar el ciclo (FT-72), y OPT-01, rotar el token del webhook (FT-03). OPT-01 es
// una operación técnica sin entrada ni previsualización: exige sesión AAL2 con `getUser()` (04 §12.3) antes de tocar nada. El
// token en claro sale una sola vez, en el `valor` de la respuesta; nunca va a un error, a un registro ni a una URL.
import { revalidatePath } from 'next/cache';
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { ejecutarDiaria } from '@finn/aplicacion/tareas/diaria';
import { errorInterno } from '@finn/aplicacion/autenticacion';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { OP19 } from '@finn/aplicacion/operaciones/ajustes';
import { rotarToken } from '@finn/aplicacion/sms/token';
import { accion } from '../accion.ts';
import { operacion } from '../operaciones.ts';
import { ARBOL_CON_DATOS } from '../revalidar.ts';
import { exigirSesionAal2 } from '../sesion.ts';

export const cambiarCiclo = accion(operacion(OP19));

export async function rotarTokenWebhook(): Promise<ResultadoAccion<{ readonly token: string }>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const { token } = await rotarToken();
    revalidatePath(ARBOL_CON_DATOS, 'layout');
    return { ok: true, valor: { token }, yaAplicada: false, avisos: [] };
  } catch {
    // Sin el detalle: ni el mensaje del error ni la pila pueden llevar datos de la operación
    return { ok: false, error: errorInterno() };
  }
}

/**
 * «Ejecutar tareas ahora» (04 §10.1, disparador manual; FT-76): todos los pasos de 10.2, con sesión AAL2 y `getUser()`. Cada paso es
 * idempotente (10.3), así que repetirla no duplica ningún hecho. Un paso que falla no la detiene: queda su evento. Sin detalle en el error.
 */
export async function ejecutarTareasAhora(): Promise<ResultadoAccion<{ readonly hoy: string }>> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return { ok: false, error: sesion.error };
  try {
    const { hoy } = await ejecutarDiaria({
      memoria: memoriaDeInstancia,
      opciones: () => ({ reloj: relojDePrueba() }),
    });
    revalidatePath(ARBOL_CON_DATOS, 'layout');
    return { ok: true, valor: { hoy }, yaAplicada: false, avisos: [] };
  } catch {
    return { ok: false, error: errorInterno() };
  }
}
