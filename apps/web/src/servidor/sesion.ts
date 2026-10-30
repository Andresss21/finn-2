// Sesión de la petición sobre `@supabase/ssr` (04 §1.2, §2.2.5, §12.2, §12.3; BE-07, BE-55; CH-50). Único lugar, con
// `proxy.ts`, que crea el cliente: las funciones de `@finn/aplicacion/autenticacion` lo reciben ya armado.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  completarInscripcion as completarInscripcionCon,
  estadoAcceso as estadoAccesoCon,
  exigirSesionEscritura,
  exigirSesionLectura,
  iniciarInscripcion as iniciarInscripcionCon,
  ingresar as ingresarCon,
  salir as salirCon,
  sesionDeCliente,
  verificarFactor as verificarFactorCon,
  type ClienteAuth,
  type ResultadoSesion,
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

/** `FINN_USUARIO_ID` ya validado por la configuración al arrancar (04 §14.2); vacío no autoriza a nadie. */
const usuarioPermitido = (): string => process.env['FINN_USUARIO_ID'] ?? '';

/** Server Components y consultas: `getClaims()` (04 §12.3). */
export async function exigirSesionAal2Lectura(): Promise<ResultadoSesion> {
  return exigirSesionLectura(sesionDeCliente(await clienteAuth()), usuarioPermitido());
}

/** Server Actions que escriben: `getUser()` más las claims (04 §2.2.2 paso 1, BE-55). */
export async function exigirSesionAal2(): Promise<ResultadoSesion> {
  return exigirSesionEscritura(sesionDeCliente(await clienteAuth()), usuarioPermitido());
}

// Las funciones de 04 §12.2 con las firmas de CP-11, sobre las cookies de la petición.
export async function estadoAcceso(): ReturnType<typeof estadoAccesoCon> {
  return estadoAccesoCon(await clienteAuth(), usuarioPermitido());
}
export async function ingresar(e: {
  email: string;
  contrasena: string;
}): ReturnType<typeof ingresarCon> {
  return ingresarCon(await clienteAuth(), usuarioPermitido(), e);
}
export async function verificarFactor(e: {
  factorId?: string;
  codigo: string;
}): ReturnType<typeof verificarFactorCon> {
  return verificarFactorCon(await clienteAuth(), usuarioPermitido(), e);
}
export async function iniciarInscripcion(e: {
  nombre?: string;
}): ReturnType<typeof iniciarInscripcionCon> {
  return iniciarInscripcionCon(await clienteAuth(), usuarioPermitido(), e);
}
export async function completarInscripcion(e: {
  factorId: string;
  codigo: string;
}): ReturnType<typeof completarInscripcionCon> {
  return completarInscripcionCon(await clienteAuth(), usuarioPermitido(), e);
}
export async function salir(): ReturnType<typeof salirCon> {
  return salirCon(await clienteAuth());
}
