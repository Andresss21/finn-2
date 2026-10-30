// Sesión de la petición para las Server Actions y los Server Components (04 §1.2, §2.2.5, §12.3; BE-07, BE-55).
// PROVISIONAL (TA-200): sin `@supabase/ssr` todavía, la petición nunca trae sesión, así que `(finn)/` siempre
// redirige a `/ingresar`. TA-214 reemplaza `sesionDeLaPeticion()` por el cliente de servidor de Supabase con las
// cookies; el resto de este archivo (las dos exigencias) queda igual.
import { cookies } from 'next/headers';
import {
  exigirSesionEscritura,
  exigirSesionLectura,
  type ResultadoSesion,
  type SesionServidor,
} from '@finn/aplicacion/autenticacion';

async function sesionDeLaPeticion(): Promise<SesionServidor> {
  await cookies(); // marca la ruta como dinámica: una sesión nunca se prerenderiza
  return {
    obtenerClaims: () => Promise.resolve(null),
    obtenerUsuario: () => Promise.resolve(null),
  };
}

/** `FINN_USUARIO_ID` ya validado por la configuración al arrancar (04 §14.2); vacío no autoriza a nadie. */
const usuarioPermitido = (): string => process.env['FINN_USUARIO_ID'] ?? '';

/** Server Components y consultas: `getClaims()` (04 §12.3). */
export async function exigirSesionAal2Lectura(): Promise<ResultadoSesion> {
  return exigirSesionLectura(await sesionDeLaPeticion(), usuarioPermitido());
}

/** Server Actions que escriben: `getUser()` más las claims (04 §2.2.2 paso 1, BE-55). */
export async function exigirSesionAal2(): Promise<ResultadoSesion> {
  return exigirSesionEscritura(await sesionDeLaPeticion(), usuarioPermitido());
}
