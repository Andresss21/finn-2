// `POST /api/notificaciones/accion` (04 §11.5, §12.3; BE-54, CH-06): adaptador de `ejecutarAccionDeNotificacion`, que
// exige `Origin` de la app, `X-Finn-Accion` y AAL2 con `getUser()` antes de ejecutar OP-40. 04 §14.2 no tiene una variable
// con la URL de la app: el origen de la app es el de la propia petición, el que el navegador compara con `Origin`.
import { after } from 'next/server';
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { ejecutarAccionDeNotificacion } from '@finn/aplicacion/push/accion';
import { sesionDeLaPeticion, usuarioPermitido } from '../../../../servidor/sesion.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(peticion: Request): Promise<Response> {
  const { estado } = await ejecutarAccionDeNotificacion(
    {
      origen: peticion.headers.get('origin'),
      cabeceraAccion: peticion.headers.get('x-finn-accion'),
      // Un cuerpo que no es JSON no pasa el contrato: 422
      cuerpo: await peticion.json().catch(() => null),
    },
    {
      memoria: memoriaDeInstancia,
      origenApp: new URL(peticion.url).origin,
      sesion: await sesionDeLaPeticion(),
      usuarioPermitido: usuarioPermitido(),
      opciones: () => ({ reloj: relojDePrueba() }),
      despues: after,
    },
  );
  return new Response(null, { status: estado });
}
