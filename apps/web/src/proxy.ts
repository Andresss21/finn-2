// Comprobación optimista y refresco de cookies (04 §12.4, §2.2.5; CP-14; CH-50). No es una barrera de seguridad: cada
// consulta, Server Action y Route Handler exige su sesión. Corre en Node.js (Next 16).
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { exigirSesionLectura, sesionDeCliente } from '@finn/aplicacion/autenticacion';

export async function proxy(peticion: NextRequest): Promise<NextResponse> {
  const { pathname, search } = peticion.nextUrl;
  const ruta = pathname + search;
  // Reemplaza siempre `x-finn-ruta`: nunca se toma de la petición entrante. Se arma al responder para llevar además
  // las cookies refrescadas de esta misma petición.
  const seguir = (): NextResponse => {
    const cabeceras = new Headers(peticion.headers);
    cabeceras.set('x-finn-ruta', ruta);
    return NextResponse.next({ request: { headers: cabeceras } });
  };
  let respuesta = seguir();

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ?? '',
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll(aFijar, cabecerasDeCache) {
          for (const { name, value } of aFijar) peticion.cookies.set(name, value);
          respuesta = seguir();
          for (const { name, value, options } of aFijar)
            respuesta.cookies.set(name, value, options);
          for (const [nombre, valor] of Object.entries(cabecerasDeCache))
            respuesta.headers.set(nombre, valor);
        },
      },
    },
  );
  // Refresca también en `/ingresar`, aunque no redirija: un Server Component no puede fijar cookies.
  const sesion = await exigirSesionLectura(
    sesionDeCliente(supabase.auth),
    process.env['FINN_USUARIO_ID'] ?? '',
  );
  // Solo una navegación redirige: una Server Action es un POST y responde `NO_AUTORIZADO` (05 §7.5).
  const navega = peticion.method === 'GET' || peticion.method === 'HEAD';
  const enIngresar = pathname === '/ingresar' || pathname.startsWith('/ingresar/');
  if (sesion.ok || enIngresar || !navega) return respuesta;

  const paso = sesion.error.datos?.['aal'] === 'aal1' ? '/ingresar/verificar' : '/ingresar';
  const destino = new URL(`${paso}?volver=${encodeURIComponent(ruta)}`, peticion.url);
  const redireccion = NextResponse.redirect(destino);
  for (const cookie of respuesta.cookies.getAll()) redireccion.cookies.set(cookie);
  return redireccion;
}

// CH-50: `/api/` queda fuera; cada Route Handler exige su secreto o su sesión y responde con su código HTTP (BE-07).
// Consecuencia: `@supabase/ssr` no refresca cookies en `/api/`; lo hace el cliente de servidor de cada handler.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|iconos/|favicon\\.ico|manifest\\.webmanifest|serwist/|sin-conexion(?:/|$)|api/).*)',
  ],
};
