// Autorización del usuario único (04 §2.2.5, §12.3; 02 ADR-08; BE-07, BE-55; CH-29).
// `accion()` llama a `exigirSesionEscritura()` y las consultas a `exigirSesionLectura()` como primer paso. La sesión
// es una interfaz propia: la Parte C la implementa con `@supabase/ssr` (cliente de servidor con cookies); aquí no se
// importa nada de Supabase.
import type { ErrorFinn } from '../errores/index.ts';

/** Claims del JWT de acceso que importan para autorizar. */
export interface ClaimsSesion {
  /** Id del usuario de Supabase Auth. */
  readonly sub: string;
  /** Nivel de seguridad de la sesión: `'aal1'` o `'aal2'` (cualquier otro valor no autoriza). */
  readonly aal: string;
}

/** Sesión de la petición en curso, sobre el cliente de servidor de Supabase. */
export interface SesionServidor {
  /**
   * `supabase.auth.getClaims()`: firma y vigencia del JWT verificadas localmente con las claves públicas del
   * proyecto. Devuelve `null` si no hay sesión, si la firma no verifica o si el JWT venció.
   */
  obtenerClaims(): Promise<ClaimsSesion | null>;
  /**
   * `supabase.auth.getUser()`: el token verificado contra el servidor de Auth (detecta una sesión cerrada o
   * revocada). Devuelve `null` si Auth no lo acepta.
   */
  obtenerUsuario(): Promise<{ readonly id: string } | null>;
}

export interface SesionAutorizada {
  readonly usuarioId: string;
  readonly aal: 'aal2';
}

/** `aal` elige la pantalla: `'ninguna'` → `/ingresar`; `'aal1'` → `/ingresar/verificar` (04 §2.3.2 [F5]). */
export type AalRechazo = 'ninguna' | 'aal1';

export type ResultadoSesion =
  | { readonly ok: true; readonly sesion: SesionAutorizada }
  | { readonly ok: false; readonly error: ErrorFinn };

/** 04 §7.7 [CH-29]. La interfaz no lo muestra: redirige (05 §7.5). */
export const MENSAJE_NO_AUTORIZADO = 'Tu sesión terminó. Ingresá de nuevo para seguir.';

export function errorNoAutorizado(aal: AalRechazo): ErrorFinn {
  return { categoria: 'NO_AUTORIZADO', codigo: 'no_autorizado', mensaje: MENSAJE_NO_AUTORIZADO, datos: { aal } };
}

const rechazo = (aal: AalRechazo): ResultadoSesion => ({ ok: false, error: errorNoAutorizado(aal) });

/**
 * Verificaciones comunes sobre las claims: `sub = FINN_USUARIO_ID` y `aal = 'aal2'`. Otro usuario es `'ninguna'`
 * aunque tenga AAL1: el segundo factor que pediría `/ingresar/verificar` no es de Finn.
 */
function verificarClaims(claims: ClaimsSesion | null, usuarioPermitido: string): ResultadoSesion {
  if (claims === null || usuarioPermitido === '' || claims.sub !== usuarioPermitido) return rechazo('ninguna');
  if (claims.aal === 'aal1') return rechazo('aal1');
  if (claims.aal !== 'aal2') return rechazo('ninguna');
  return { ok: true, sesion: { usuarioId: usuarioPermitido, aal: 'aal2' } };
}

/**
 * Server Components y consultas: solo `getClaims()`, sin red con la caché de claves caliente. Una sesión revocada
 * sigue leyendo hasta que vence su JWT (riesgo aceptado en 04 §12.3).
 *
 * @param usuarioPermitido `FINN_USUARIO_ID`, ya validado por la configuración.
 */
export async function exigirSesionLectura(sesion: SesionServidor, usuarioPermitido: string): Promise<ResultadoSesion> {
  return verificarClaims(await sesion.obtenerClaims(), usuarioPermitido);
}

/**
 * Server Actions que escriben, acciones desde notificaciones, exportación, OPT-01, OPT-05, MFA y cierre de otras
 * sesiones: `getUser()` (revocación) y las mismas verificaciones de `aal` y `sub` sobre las claims.
 *
 * @param usuarioPermitido `FINN_USUARIO_ID`, ya validado por la configuración.
 */
export async function exigirSesionEscritura(
  sesion: SesionServidor,
  usuarioPermitido: string,
): Promise<ResultadoSesion> {
  const usuario = await sesion.obtenerUsuario();
  if (usuario === null || usuario.id !== usuarioPermitido) return rechazo('ninguna');
  return verificarClaims(await sesion.obtenerClaims(), usuarioPermitido);
}
