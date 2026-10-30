// Funciones de autenticación que llama la interfaz (04 §12.2, CP-11; 05 §9.7; CH-50). Solo `apps/web` importa
// `@supabase/ssr` (04 §1.3): aquí llega el cliente por `ClienteAuth`, la parte de `supabase.auth` que se usa, como
// `SesionServidor` de autorizar.ts. No crean hechos de Finn: sin idempotencia por id.
import * as z from 'zod';
import {
  errorDeValidacion,
  mensajeDeRechazo,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '../errores/index.ts';
import { errorNoAutorizado, exigirSesionEscritura, type SesionServidor } from './autorizar.ts';

export interface ErrorAuth {
  readonly name?: string;
  readonly status?: number | undefined;
  readonly code?: string | undefined;
}
interface Respuesta<T> {
  readonly data: T;
  readonly error: ErrorAuth | null;
}
interface FactorAuth {
  readonly id: string;
  readonly friendly_name?: string | undefined;
  readonly factor_type: string;
  readonly status: string;
}

/** Lo que estas funciones usan de `supabase.auth`; el cliente real la cumple sin adaptador. */
export interface ClienteAuth {
  signInWithPassword(c: {
    email: string;
    password: string;
  }): Promise<Respuesta<{ user: { id: string } | null }>>;
  signOut(o: { scope: 'local' }): Promise<{ error: ErrorAuth | null }>;
  getClaims(): Promise<Respuesta<{ claims: { sub?: string; aal?: unknown } } | null>>;
  getUser(): Promise<Respuesta<{ user: { id: string } | null }>>;
  mfa: {
    listFactors(): Promise<Respuesta<{ all: readonly FactorAuth[] } | null>>;
    challenge(p: { factorId: string }): Promise<Respuesta<{ id: string } | null>>;
    verify(p: {
      factorId: string;
      challengeId: string;
      code: string;
    }): Promise<Respuesta<unknown>>;
    enroll(p: {
      factorType: 'totp';
      friendlyName: string;
    }): Promise<
      Respuesta<{ id: string; totp: { qr_code: string; secret: string; uri: string } } | null>
    >;
    unenroll(p: { factorId: string }): Promise<Respuesta<unknown>>;
  };
}

/** La `SesionServidor` de TA-161 sobre el cliente: `getClaims()` para leer, `getUser()` para escribir (04 §12.3). */
export function sesionDeCliente(auth: ClienteAuth): SesionServidor {
  return {
    async obtenerClaims() {
      const claims = (await auth.getClaims()).data?.claims;
      if (typeof claims?.sub !== 'string' || typeof claims.aal !== 'string') return null;
      return { sub: claims.sub, aal: claims.aal };
    },
    async obtenerUsuario() {
      const { user } = (await auth.getUser()).data;
      return user === null ? null : { id: user.id };
    },
  };
}

type CodigoAuth =
  | 'credenciales_invalidas'
  | 'demasiados_intentos'
  | 'codigo_incorrecto'
  | 'codigo_vencido'
  | 'inscripcion_no_permitida';

const propio = (codigo: CodigoAuth): ErrorFinn => ({
  categoria: 'DOMINIO',
  codigo,
  mensaje: mensajeDeRechazo({ codigo }) ?? codigo,
});

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** `INTERNO` con el `idError` de 04 §7.8. */
function interno(): ErrorFinn {
  const idError = `E-${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CROCKFORD[b % 32]).join('')}`;
  return { categoria: 'INTERNO', codigo: 'interno', mensaje: mensajeInterno(idError), idError };
}

const ok = <T>(valor: T): ResultadoAccion<T> => ({
  ok: true,
  valor,
  yaAplicada: false,
  avisos: [],
});
const falla = (error: ErrorFinn): { ok: false; error: ErrorFinn } => ({ ok: false, error });

/** Auth caído (sin estado o 5xx) no es un dato mal escrito: nunca se presenta como "contraseña incorrecta". */
const esFallaDeAuth = (e: ErrorAuth): boolean =>
  e.status === undefined || e.status === 0 || e.status >= 500;
const esLimite = (e: ErrorAuth): boolean =>
  e.status === 429 || e.code === 'over_request_rate_limit';

function errorDeCodigo(e: ErrorAuth): ErrorFinn {
  if (esLimite(e)) return propio('demasiados_intentos');
  if (esFallaDeAuth(e)) return interno();
  return propio(e.code === 'mfa_challenge_expired' ? 'codigo_vencido' : 'codigo_incorrecto');
}

async function factores(
  auth: ClienteAuth,
): Promise<{ verificados: FactorAuth[]; sinVerificar: FactorAuth[] } | null> {
  const { data, error } = await auth.mfa.listFactors();
  if (error !== null || data === null) return null;
  const totp = data.all.filter((f) => f.factor_type === 'totp');
  return {
    verificados: totp.filter((f) => f.status === 'verified'),
    sinVerificar: totp.filter((f) => f.status !== 'verified'),
  };
}

/** `sesion`: nivel del usuario permitido según `exigirSesionEscritura` (`getUser` y claims), con AAL1 también válido. */
async function exigirUsuario(
  auth: ClienteAuth,
  usuarioPermitido: string,
): Promise<{ ok: true; sesion: 'aal1' | 'aal2' } | { ok: false; error: ErrorFinn }> {
  const r = await exigirSesionEscritura(sesionDeCliente(auth), usuarioPermitido);
  if (r.ok) return { ok: true, sesion: 'aal2' };
  return r.error.datos?.['aal'] === 'aal1' ? { ok: true, sesion: 'aal1' } : falla(r.error);
}

async function retarYVerificar(
  auth: ClienteAuth,
  factorId: string,
  codigo: string,
): Promise<ResultadoAccion<Record<string, never>>> {
  const reto = await auth.mfa.challenge({ factorId });
  if (reto.error !== null || reto.data === null)
    return falla(reto.error === null ? interno() : errorDeCodigo(reto.error));
  const { error } = await auth.mfa.verify({ factorId, challengeId: reto.data.id, code: codigo });
  return error === null ? ok({}) : falla(errorDeCodigo(error));
}

const ENTRADA_INGRESAR = z.object({
  email: z.string().trim().min(1, { error: 'Escribí tu email.' }),
  contrasena: z.string().min(1, { error: 'Escribí tu contraseña.' }),
});
const CODIGO = z.string().regex(/^\d{6}$/, { error: 'Escribí los 6 dígitos del código.' });
const ENTRADA_VERIFICAR = z.object({ factorId: z.string().min(1).optional(), codigo: CODIGO });
const ENTRADA_INICIAR = z.object({ nombre: z.string().trim().min(1).optional() });
const ENTRADA_COMPLETAR = z.object({ factorId: z.string().min(1), codigo: CODIGO });

export interface EstadoAcceso {
  readonly sesion: 'ninguna' | 'aal1' | 'aal2';
  readonly usuarioPermitido: boolean;
  readonly factoresVerificados: readonly { id: string; nombre: string | null }[];
}

/** Sin exigir AAL2: la usan las rutas de `ingresar`. Solo lista los factores del usuario permitido. */
export async function estadoAcceso(
  auth: ClienteAuth,
  usuarioPermitido: string,
): Promise<EstadoAcceso> {
  const claims = await sesionDeCliente(auth).obtenerClaims();
  if (claims === null || (claims.aal !== 'aal1' && claims.aal !== 'aal2'))
    return { sesion: 'ninguna', usuarioPermitido: false, factoresVerificados: [] };
  if (usuarioPermitido === '' || claims.sub !== usuarioPermitido)
    return { sesion: claims.aal, usuarioPermitido: false, factoresVerificados: [] };
  const lista = await factores(auth);
  if (lista === null) throw new Error('estadoAcceso: Auth no devolvió los factores');
  return {
    sesion: claims.aal,
    usuarioPermitido: true,
    factoresVerificados: lista.verificados.map((f) => ({
      id: f.id,
      nombre: f.friendly_name ?? null,
    })),
  };
}

/** No exige sesión. Un usuario distinto del permitido recibe el mismo error que una contraseña mala (05 §9.3). */
export async function ingresar(
  auth: ClienteAuth,
  usuarioPermitido: string,
  cruda: unknown,
): Promise<ResultadoAccion<{ siguiente: 'verificar' | 'inscribir' | 'listo' }>> {
  const entrada = ENTRADA_INGRESAR.safeParse(cruda);
  if (!entrada.success) return falla(errorDeValidacion(entrada.error.issues));

  const { email, contrasena: password } = entrada.data;
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error !== null) {
    if (esLimite(error)) return falla(propio('demasiados_intentos'));
    return falla(esFallaDeAuth(error) ? interno() : propio('credenciales_invalidas'));
  }
  if (data.user?.id !== usuarioPermitido || usuarioPermitido === '') {
    await auth.signOut({ scope: 'local' });
    return falla(propio('credenciales_invalidas'));
  }
  const lista = await factores(auth);
  if (lista === null) return falla(interno());
  return ok({ siguiente: lista.verificados.length > 0 ? 'verificar' : 'inscribir' });
}

/** Exige AAL1 del usuario permitido. Solo acepta un factor ya verificado: uno sin verificar no da AAL2 por esta vía. */
export async function verificarFactor(
  auth: ClienteAuth,
  usuarioPermitido: string,
  cruda: unknown,
): Promise<ResultadoAccion<Record<string, never>>> {
  const entrada = ENTRADA_VERIFICAR.safeParse(cruda);
  if (!entrada.success) return falla(errorDeValidacion(entrada.error.issues));
  const usuario = await exigirUsuario(auth, usuarioPermitido);
  if (!usuario.ok) return falla(usuario.error);

  const lista = await factores(auth);
  if (lista === null) return falla(interno());
  const primero = lista.verificados[0];
  if (primero === undefined) return falla(errorNoAutorizado('aal1')); // sin factores: la tabla lleva a inscribir
  const { factorId = primero.id, codigo } = entrada.data;
  if (!lista.verificados.some((f) => f.id === factorId))
    return falla(propio('codigo_incorrecto'));
  return retarYVerificar(auth, factorId, codigo);
}

/**
 * Con AAL1 se niega si ya hay un factor verificado (04 §12.2); con AAL2 es el factor de respaldo. Quita antes los
 * factores sin verificar de intentos anteriores (05 §9.5). El secreto solo viaja en la respuesta.
 */
export async function iniciarInscripcion(
  auth: ClienteAuth,
  usuarioPermitido: string,
  cruda: unknown,
): Promise<ResultadoAccion<{ factorId: string; qrSvg: string; secreto: string; uri: string }>> {
  const entrada = ENTRADA_INICIAR.safeParse(cruda);
  if (!entrada.success) return falla(errorDeValidacion(entrada.error.issues));
  const usuario = await exigirUsuario(auth, usuarioPermitido);
  if (!usuario.ok) return falla(usuario.error);

  const lista = await factores(auth);
  if (lista === null) return falla(interno());
  const hayFactor = lista.verificados.length > 0;
  if (usuario.sesion === 'aal1' && hayFactor) return falla(propio('inscripcion_no_permitida'));

  for (const { id } of lista.sinVerificar) {
    const { error } = await auth.mfa.unenroll({ factorId: id });
    if (error !== null) return falla(interno());
  }
  const { data, error } = await auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: entrada.data.nombre ?? (hayFactor ? 'Respaldo' : 'Autenticador'),
  });
  if (error !== null || data === null) return falla(interno());
  return ok({
    factorId: data.id,
    qrSvg: data.totp.qr_code,
    secreto: data.totp.secret,
    uri: data.totp.uri,
  });
}

/** Mismas condiciones que `iniciarInscripcion`; con éxito, la sesión es AAL2. */
export async function completarInscripcion(
  auth: ClienteAuth,
  usuarioPermitido: string,
  cruda: unknown,
): Promise<ResultadoAccion<Record<string, never>>> {
  const entrada = ENTRADA_COMPLETAR.safeParse(cruda);
  if (!entrada.success) return falla(errorDeValidacion(entrada.error.issues));
  const usuario = await exigirUsuario(auth, usuarioPermitido);
  if (!usuario.ok) return falla(usuario.error);

  if (usuario.sesion === 'aal1') {
    const lista = await factores(auth);
    if (lista === null) return falla(interno());
    if (lista.verificados.length > 0) return falla(propio('inscripcion_no_permitida'));
  }
  return retarYVerificar(auth, entrada.data.factorId, entrada.data.codigo);
}

/** `signOut({ scope: 'local' })`. Sin sesión ya es el estado pedido. */
export async function salir(auth: ClienteAuth): Promise<ResultadoAccion<Record<string, never>>> {
  const { error } = await auth.signOut({ scope: 'local' });
  return error === null || error.name === 'AuthSessionMissingError' ? ok({}) : falla(interno());
}
