// Sesión de la petición sobre `@supabase/ssr` (04 §1.2, §2.2.5, §12.2, §12.3; BE-07, BE-55; CH-50). Único lugar, con
// `proxy.ts`, que crea el cliente: las funciones de `@finn/aplicacion/autenticacion` lo reciben ya armado.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as acceso from '@finn/aplicacion/autenticacion';
import {
  exigirSesionEscritura,
  exigirSesionLectura,
  type ClienteAuth,
  type ResultadoSesion,
  type SesionServidor,
} from '@finn/aplicacion/autenticacion';

/** `cookies()` primero: marca la ruta como dinámica, una sesión nunca se prerenderiza. */
async function clienteAuth(): Promise<ClienteAuth> {
  const almacen = await cookies();
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ?? '',
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(aFijar) {
          // Un Server Component no puede fijar cookies; ahí las refresca `proxy.ts`.
          try {
            for (const { name, value, options } of aFijar) almacen.set(name, value, options);
          } catch {
            return;
          }
        },
      },
    },
  ).auth;
}

/** La sesión sin exigir nada todavía: para las funciones de `@finn/aplicacion` que exigen por su cuenta. */
export async function sesionDeLaPeticion(): Promise<SesionServidor> {
  return acceso.sesionDeCliente(await clienteAuth());
}

/** El correo de la sesión para el marco y Ajustes (entrega 3, «Salir»): del JWT ya verificado; no es dato del motor. Sin él, `undefined`. */
export async function correoDeLaSesion(): Promise<string | undefined> {
  try {
    const { data } = await (await clienteAuth()).getClaims();
    const correo = (data?.claims as { readonly email?: unknown } | undefined)?.email;
    return typeof correo === 'string' && correo !== '' ? correo : undefined;
  } catch {
    return undefined;
  }
}

/** `FINN_USUARIO_ID` ya validado por la configuración al arrancar (04 §14.2); vacío no autoriza a nadie. */
export const usuarioPermitido = (): string => process.env['FINN_USUARIO_ID'] ?? '';

/** Server Components y consultas: `getClaims()` (04 §12.3). */
export async function exigirSesionAal2Lectura(): Promise<ResultadoSesion> {
  return exigirSesionLectura(await sesionDeLaPeticion(), usuarioPermitido());
}

/** Server Actions que escriben: `getUser()` más las claims (04 §2.2.2 paso 1, BE-55). */
export async function exigirSesionAal2(): Promise<ResultadoSesion> {
  return exigirSesionEscritura(await sesionDeLaPeticion(), usuarioPermitido());
}

/** El `session_id` del JWT, para la auditoría de OPT-05 (04 §8.7); nunca se muestra. Solo se llama con la sesión ya exigida. */
export async function sesionIdDeLaPeticion(): Promise<string> {
  const { data } = await (await clienteAuth()).getClaims();
  const id = (data?.claims as { readonly session_id?: unknown } | undefined)?.session_id;
  return typeof id === 'string' ? id : 'sin_sesion';
}

/** Las funciones de 04 §12.2 sobre las cookies de la petición. La entrada es cruda: la valida su contrato. */
const conCookies =
  <R>(f: (a: ClienteAuth, usuario: string, cruda: unknown) => Promise<R>) =>
  async (cruda: unknown): Promise<R> =>
    f(await clienteAuth(), usuarioPermitido(), cruda);

export const ingresar = conCookies(acceso.ingresar);
export const verificarFactor = conCookies(acceso.verificarFactor);
export const iniciarInscripcion = conCookies(acceso.iniciarInscripcion);
export const completarInscripcion = conCookies(acceso.completarInscripcion);
export const quitarFactor = conCookies(acceso.quitarFactor);
export const cerrarOtrasSesiones = conCookies(acceso.cerrarOtrasSesiones);
/** CP-4: la lista de factores de Ajustes > Seguridad. Lanza `ExcepcionFinn`; la página la pasa por `consultar()`. */
export const estadoSeguridad = async (): Promise<acceso.EstadoSeguridad> =>
  acceso.estadoSeguridad(await clienteAuth(), usuarioPermitido());
export const estadoAcceso = async (): Promise<acceso.EstadoAcceso> =>
  acceso.estadoAcceso(await clienteAuth(), usuarioPermitido());
export const salir = async (): ReturnType<typeof acceso.salir> => acceso.salir(await clienteAuth());
