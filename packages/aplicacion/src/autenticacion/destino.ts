// Tabla de redirecciones de las rutas de `ingresar` (05 §9.2, FE-36; CH-50): función pura que llaman sus páginas.
// `proxy.ts` no redirige estas rutas (CP-14): esta tabla es la única lógica.

import type { EstadoAcceso } from './supabase.ts';

export type RutaAcceso = '/ingresar' | '/ingresar/verificar' | '/ingresar/inscribir';

export type EstadoParaDestino = EstadoAcceso;

/** `cerrarSesion`: la página cierra la sesión del usuario no permitido antes de seguir (`/ingresar` muestra el mensaje). */
export type DestinoAcceso =
  | { readonly accion: 'mostrar'; readonly cerrarSesion: boolean }
  | { readonly accion: 'redirigir'; readonly destino: string; readonly cerrarSesion: boolean };

/**
 * 05 §3.6: solo una ruta interna; empieza con `/` y no con `//` ni `/\`, y sin caracteres de control (el navegador
 * descarta tabuladores y saltos de línea: `/<tab>/x` sería `//x`). Si no, `/`. La usa también `consultar()` (05 §7.3).
 */
export const rutaInterna = (volver: string | null): string =>
  volver !== null && /^\/(?![/\\])/.test(volver) && !/[\u0000-\u001f\u007f]/.test(volver)
    ? volver
    : '/';

/**
 * @param volver el `?volver=` recibido; se conserva en cada redirección a otra ruta de `ingresar` y es el destino con
 * AAL2. La tabla nombra AAL1 para el usuario no permitido; se aplica igual con AAL2, porque `volver` lo devolvería acá.
 */
export function destinoAcceso(
  estado: EstadoParaDestino,
  ruta: RutaAcceso,
  volver: string | null,
): DestinoAcceso {
  const saneado = rutaInterna(volver);
  const paso = (destino: RutaAcceso, cerrarSesion = false): DestinoAcceso =>
    ruta === destino
      ? { accion: 'mostrar', cerrarSesion }
      : {
          accion: 'redirigir',
          destino: volver === null ? destino : `${destino}?volver=${encodeURIComponent(saneado)}`,
          cerrarSesion,
        };

  if (estado.sesion === 'ninguna') return paso('/ingresar');
  if (!estado.usuarioPermitido) return paso('/ingresar', true);
  if (estado.sesion === 'aal2')
    return { accion: 'redirigir', destino: saneado, cerrarSesion: false };
  return paso(
    estado.factoresVerificados.length > 0 ? '/ingresar/verificar' : '/ingresar/inscribir',
  );
}
