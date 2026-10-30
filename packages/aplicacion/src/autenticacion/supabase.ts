// Funciones de autenticación de la interfaz (04 §12.2, CP-11; 05 §9.7; CH-50). Solo `apps/web` importa `@supabase/ssr`
// (04 §1.3): el cliente llega por `ClienteAuth`, como `SesionServidor`. Sin idempotencia: no crean hechos de Finn.
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
type ConUsuario = { readonly user: { id: string } | null };
type Inscrito = { readonly id: string; totp: { qr_code: string; secret: string; uri: string } };
interface FactorAuth {
  readonly id: string;
  readonly friendly_name?: string | undefined;
  readonly factor_type: string;
  readonly status: string;
}

/** Lo que estas funciones usan de `supabase.auth`; el cliente real la cumple sin adaptador. */
export interface ClienteAuth {
  signInWithPassword(c: { email: string; password: string }): Promise<Respuesta<ConUsuario>>;
  signOut(o: { scope: 'local' }): Promise<{ error: ErrorAuth | null }>;
  getClaims(): Promise<Respuesta<{ claims: { sub?: string; aal?: unknown } } | null>>;
  getUser(): Promise<Respuesta<ConUsuario>>;
  mfa: {
    listFactors(): Promise<Respuesta<{ all: readonly FactorAuth[] } | null>>;
    challenge(p: { factorId: string }): Promise<Respuesta<{ id: string } | null>>;
    verify(p: { factorId: string; challengeId: string; code: string }): Promise<Respuesta<unknown>>;
    enroll(p: { factorType: 'totp'; friendlyName: string }): Promise<Respuesta<Inscrito | null>>;
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

const propio = (codigo: string): ErrorFinn => ({
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

type Vacio = Record<string, never>;
const ok = <T>(valor: T): ResultadoAccion<T> => ({
  ok: true,
  valor,
  yaAplicada: false,
  avisos: [],
});
const falla = (error: ErrorFinn): { ok: false; error: ErrorFinn } => ({ ok: false, error });

/** Auth caído (sin estado o 5xx) no es un dato mal escrito: nunca se presenta como "contraseña incorrecta". */
const esFallaDeAuth = (e: ErrorAuth): boolean => !e.status || e.status >= 500;
const esLimite = (e: ErrorAuth): boolean => e.status === 429;

function errorDeCodigo(e: ErrorAuth): ErrorFinn {
  if (esLimite(e)) return propio('demasiados_intentos');
  if (esFallaDeAuth(e)) return interno();
  return propio(e.code === 'mfa_challenge_expired' ? 'codigo_vencido' : 'codigo_incorrecto');
}

type Factores = Record<'verificados' | 'sinVerificar', FactorAuth[]>;

async function factores(auth: ClienteAuth): Promise<Factores | null> {
  const { data, error } = await auth.mfa.listFactors();
  if (error !== null || data === null) return null;
  const totp = data.all.filter((f) => f.factor_type === 'totp');
  return {
    verificados: totp.filter((f) => f.status === 'verified'),
    sinVerificar: totp.filter((f) => f.status !== 'verified'),
  };
}

type Contexto<E> = { entrada: E; sesion: 'aal1' | 'aal2'; lista: Factores };

/** Lo común de MFA: contrato, usuario permitido (`getUser` y claims; AAL1 también vale, 04 §12.2) y sus factores. */
const conUsuario =
  <E, T>(
    contrato: z.ZodType<E>,
    cuerpo: (auth: ClienteAuth, c: Contexto<E>) => Promise<ResultadoAccion<T>>,
  ) =>
  async (auth: ClienteAuth, permitido: string, cruda: unknown): Promise<ResultadoAccion<T>> => {
    const entrada = contrato.safeParse(cruda);
    if (!entrada.success) return falla(errorDeValidacion(entrada.error.issues));
    const r = await exigirSesionEscritura(sesionDeCliente(auth), permitido);
    if (!r.ok && r.error.datos?.['aal'] !== 'aal1') return falla(r.error);
    const lista = await factores(auth);
    if (lista === null) return falla(interno());
    return cuerpo(auth, { entrada: entrada.data, sesion: r.ok ? 'aal2' : 'aal1', lista });
  };

async function retarYVerificar(
  auth: ClienteAuth,
  factorId: string,
  codigo: string,
): Promise<ResultadoAccion<Vacio>> {
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

export interface EstadoAcceso {
  readonly sesion: 'ninguna' | 'aal1' | 'aal2';
  readonly usuarioPermitido: boolean;
  readonly factoresVerificados: readonly { id: string; nombre: string | null }[];
}

/** Sin exigir AAL2: la usan las rutas de `ingresar`. Solo lista los factores del usuario permitido. */
export async function estadoAcceso(auth: ClienteAuth, permitido: string): Promise<EstadoAcceso> {
  const claims = await sesionDeCliente(auth).obtenerClaims();
  if (claims === null || (claims.aal !== 'aal1' && claims.aal !== 'aal2'))
    return { sesion: 'ninguna', usuarioPermitido: false, factoresVerificados: [] };
  if (permitido === '' || claims.sub !== permitido)
    return { sesion: claims.aal, usuarioPermitido: false, factoresVerificados: [] };
  const lista = await factores(auth);
  if (lista === null) throw new Error('estadoAcceso: Auth no devolvió los factores');
  const verificados = lista.verificados.map((f) => ({ id: f.id, nombre: f.friendly_name ?? null }));
  return { sesion: claims.aal, usuarioPermitido: true, factoresVerificados: verificados };
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

/** Solo acepta un factor ya verificado: uno sin verificar no da AAL2 por esta vía. */
export const verificarFactor = conUsuario(
  z.object({ factorId: z.string().min(1).optional(), codigo: CODIGO }),
  async (auth, { entrada, lista }) => {
    const primero = lista.verificados[0];
    if (primero === undefined) return falla(errorNoAutorizado('aal1')); // sin factores: la tabla lleva a inscribir
    const factorId = entrada.factorId ?? primero.id;
    if (!lista.verificados.some((f) => f.id === factorId))
      return falla(propio('codigo_incorrecto'));
    return retarYVerificar(auth, factorId, entrada.codigo);
  },
);

/** Con AAL1 se niega si hay un factor verificado (04 §12.2); con AAL2 es el respaldo. Quita los colgados (05 §9.5). */
export const iniciarInscripcion = conUsuario(
  z.object({ nombre: z.string().trim().min(1).optional() }),
  async (auth, { entrada, sesion, lista }) => {
    const hayFactor = lista.verificados.length > 0;
    if (sesion === 'aal1' && hayFactor) return falla(propio('inscripcion_no_permitida'));
    for (const { id } of lista.sinVerificar) {
      const { error } = await auth.mfa.unenroll({ factorId: id });
      if (error !== null) return falla(interno());
    }
    const { data, error } = await auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: entrada.nombre ?? (hayFactor ? 'Respaldo' : 'Autenticador'),
    });
    if (error !== null || data === null) return falla(interno());
    const { qr_code: qrSvg, secret: secreto, uri } = data.totp;
    return ok({ factorId: data.id, qrSvg, secreto, uri });
  },
);

/** Mismas condiciones que `iniciarInscripcion`; con éxito, la sesión es AAL2. */
export const completarInscripcion = conUsuario(
  z.object({ factorId: z.string().min(1), codigo: CODIGO }),
  async (auth, { entrada, sesion, lista }) => {
    if (sesion === 'aal1' && lista.verificados.length > 0)
      return falla(propio('inscripcion_no_permitida'));
    return retarYVerificar(auth, entrada.factorId, entrada.codigo);
  },
);

/** `signOut({ scope: 'local' })`. Sin sesión ya es el estado pedido. */
export async function salir(auth: ClienteAuth): Promise<ResultadoAccion<Vacio>> {
  const { error } = await auth.signOut({ scope: 'local' });
  return error === null || error.name === 'AuthSessionMissingError' ? ok({}) : falla(interno());
}
