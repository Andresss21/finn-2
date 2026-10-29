// Token del webhook (ADR-08; 04 §8.2 paso 2, §8.8; 03 §7.5; OPT-01). En la base solo está su SHA-256 en hexadecimal;
// el token en claro sale una sola vez, al rotarlo, y nunca se guarda ni se registra.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  escribirTecnico as escribirTecnicoDb,
  guardarHashToken,
  leer as leerDb,
  leerHashToken,
  type OpcionesTx,
} from '@finn/db';

const sha256 = (token: string): Buffer => createHash('sha256').update(token, 'utf8').digest();
const HASH = /^[0-9a-f]{64}$/;

/** `Authorization: Bearer <token>` → el token; cualquier otra forma, `null` (BE-59: una sola cabecera). */
export function tokenDeCabecera(autorizacion: string | null): string | null {
  return /^Bearer (\S+)$/.exec(autorizacion ?? '')?.[1] ?? null;
}

/** Paso 2 de 04 §8.2: SHA-256 del recibido contra el guardado, con `timingSafeEqual` sobre los 32 bytes. */
export function tokenValido(token: string | null, hashGuardado: string | null): boolean {
  if (token === null || hashGuardado === null || !HASH.test(hashGuardado)) return false;
  return timingSafeEqual(sha256(token), Buffer.from(hashGuardado, 'hex'));
}

export interface DepsToken {
  readonly leer?: typeof leerDb;
  readonly escribirTecnico?: typeof escribirTecnicoDb;
  readonly opciones?: () => OpcionesTx;
}

/** El hash se lee en cada petición, en una transacción corta (BE-33): una rotación rige de inmediato. */
export async function autenticar(autorizacion: string | null, d: DepsToken): Promise<boolean> {
  const hash = await (d.leer ?? leerDb)((tx) => leerHashToken(tx), d.opciones?.());
  return tokenValido(tokenDeCabecera(autorizacion), hash);
}

/**
 * OPT-01 (04 §3.10, §8.8): 32 bytes aleatorios en base64url; guarda solo su SHA-256 en `token_webhook` ([T], sin
 * bloqueo) y devuelve el token para mostrarlo una vez. El anterior deja de valer al confirmar.
 */
export async function rotarToken(d: DepsToken = {}): Promise<{ readonly token: string }> {
  const token = randomBytes(32).toString('base64url');
  const hash = sha256(token).toString('hex');
  await (d.escribirTecnico ?? escribirTecnicoDb)(
    (tx) => guardarHashToken(tx, hash),
    d.opciones?.(),
  );
  return { token };
}
