// OPT-09 (04 §3.10, §16.3, §16.4; ADR-22): los eventos que GitHub Actions informa por `POST /api/respaldo/[evento]`,
// sin HTTP. Autentica con `RESPALDO_SECRET` en tiempo constante (12.5), valida el cuerpo y escribe `estado_respaldo`
// y `eventos_sistema` ([T]) en una sola transacción corta sin el bloqueo global (03 §5.1, BE-33). El Route Handler
// (Parte C) solo traduce la respuesta. Ni el secreto ni el cuerpo crudo se registran (15.3).
import { createHash, timingSafeEqual } from 'node:crypto';
import * as z from 'zod';
import {
  escribirTecnico as escribirTecnicoDb,
  registrarEvento,
  registrarRespaldo,
  registrarRestauracion,
  type DatosEvento,
  type EscritorTecnicoTx,
  type NuevoEvento,
  type OpcionesTx,
} from '@finn/db';
import { tokenDeCabecera } from '../sms/token.ts';

export interface PeticionRespaldo {
  readonly autorizacion: string | null;
  /** El segmento `[evento]` de la ruta. */
  readonly evento: string;
  /** El cuerpo como texto; vacío vale `{}`. */
  readonly cuerpo: string;
}

export type RespuestaRespaldo = { readonly estado: 200 | 400 | 401 | 404 | 503 };

export interface DepsRespaldo {
  /** `RESPALDO_SECRET` (04 §14.2): ≥ 32 caracteres; uno más corto nunca autentica. */
  readonly secreto: string;
  readonly escribirTecnico?: typeof escribirTecnicoDb;
  /** El reloj de prueba (CT-01); vacío en producción. */
  readonly opciones?: () => OpcionesTx;
}

const LIMITE_CUERPO = 4096;
const sha256 = (t: string): Buffer => createHash('sha256').update(t, 'utf8').digest();

/** 12.5: SHA-256 de ambos lados y `timingSafeEqual` sobre los 32 bytes; las longitudes distintas no filtran nada. */
export function secretoValido(autorizacion: string | null, secreto: string): boolean {
  const recibido = tokenDeCabecera(autorizacion);
  if (recibido === null || secreto.length < 32) return false;
  return timingSafeEqual(sha256(recibido), sha256(secreto));
}

const entero = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
// `finn.revision.valor` es BIGINT: `pg` lo entrega como texto; se guarda como texto
const revision = z.union([z.string().regex(/^(0|[1-9]\d{0,18})$/), entero]).transform(String);

const CUERPOS = {
  // 16.3 paso 4: `{ objeto, revision, bytes }`, con la clave de R2 de 16.3 paso 3
  respaldo: z.strictObject({
    objeto: z
      .string()
      .regex(/^(diarios|mensuales)\/[\w-]+(\.[\w-]+)*$/)
      .max(200),
    revision,
    bytes: entero,
  }),
  // 16.4: sin datos
  restauracion: z.strictObject({}),
  // 16.3 paso 5: el control y el número de filas, sin su contenido
  deriva: z.strictObject({ control: z.enum(['C5', 'C6']), filas: entero.min(1) }),
} as const;

type Evento = keyof typeof CUERPOS;
const esEvento = (e: string): e is Evento => Object.hasOwn(CUERPOS, e);

function leerCuerpo(evento: Evento, texto: string): DatosEvento | null {
  if (texto.length > LIMITE_CUERPO) return null;
  let crudo: unknown;
  try {
    crudo = texto.trim() === '' ? {} : JSON.parse(texto);
  } catch {
    return null;
  }
  const r = CUERPOS[evento].safeParse(crudo);
  return r.success ? (r.data as DatosEvento) : null;
}

/** 15.2: `respaldo` y `restauracion` son `info`; `deriva`, `error`. La restauración no lleva datos. */
function evento(e: Evento, datos: DatosEvento): NuevoEvento {
  const nivel = e === 'deriva' ? 'error' : 'info';
  return { nivel, origen: 'respaldo', mensaje: e, ...(e === 'restauracion' ? {} : { datos }) };
}

async function escribirEvento(tx: EscritorTecnicoTx, e: Evento, datos: DatosEvento): Promise<void> {
  if (e === 'respaldo') await registrarRespaldo(tx, String(datos['objeto']));
  if (e === 'restauracion') await registrarRestauracion(tx);
  await registrarEvento(tx, evento(e, datos));
}

/** OPT-09. Un 401 deja un `aviso` sin datos de la petición (12.5), best-effort; nunca cambia la respuesta. */
export async function registrarEventoRespaldo(
  p: PeticionRespaldo,
  d: DepsRespaldo,
): Promise<RespuestaRespaldo> {
  const escribir = d.escribirTecnico ?? escribirTecnicoDb;
  if (!secretoValido(p.autorizacion, d.secreto)) {
    const aviso: NuevoEvento = { nivel: 'aviso', origen: 'respaldo', mensaje: 'token_invalido' };
    await escribir((tx) => registrarEvento(tx, aviso), d.opciones?.()).catch(() => undefined);
    return { estado: 401 };
  }
  if (!esEvento(p.evento)) return { estado: 404 };
  const e = p.evento;
  const datos = leerCuerpo(e, p.cuerpo);
  if (datos === null) return { estado: 400 };
  try {
    await escribir((tx) => escribirEvento(tx, e, datos), d.opciones?.());
  } catch {
    return { estado: 503 }; // el job falla y GitHub avisa por correo (16.3 paso 6)
  }
  return { estado: 200 };
}
