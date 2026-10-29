// `POST /api/sms` sin HTTP (04 §8.1, §8.2; ADR-09, N-01; BE-44, BE-59, BE-60, BE-61). Autentica, lee el cuerpo,
// guarda el SMS sin el bloqueo global y devuelve el código; el Route Handler solo lo traduce y pasa `despues` a
// `after()` de Next. Ni el token ni el cuerpo se registran. Procesar el SMS y barrer los que quedaron sin resultado
// (pasos 6 y 7, 04 §8.4, §8.6) es de TA-242 [CH-35]: hasta entonces `despues` no hace nada.
import {
  escribirSms as escribirSmsDb,
  escribirTecnico as escribirTecnicoDb,
  guardarSms,
  registrarEvento,
  sqlstateDe,
  type NuevoEvento,
} from '@finn/db';
import { leerCuerpo, LIMITE_CUERPO_BYTES, type FormatoWebhook } from '../contratos/webhook.ts';
import { idErrorAleatorio, type DepsMarco } from '../operaciones/marco.ts';
import { autenticar } from './token.ts';

export interface PeticionWebhook {
  readonly autorizacion: string | null;
  readonly contentType: string | null;
  /** Cabecera `X-Finn-Remitente` (variante B). */
  readonly remitente: string | null;
  readonly cuerpo: Uint8Array;
}

export type RespuestaWebhook =
  | {
      readonly estado: 200;
      readonly cuerpo: { readonly recibido: true; readonly id: string };
      /** Para `after()`: pasos 6 y 7 de 04 §8.2 (TA-242). Nunca lanza. */
      readonly despues: () => Promise<void>;
    }
  | { readonly estado: 401 | 413 }
  | { readonly estado: 503; readonly reintentarEn: 30 };

export interface DepsWebhook extends DepsMarco {
  /** `FINN_WEBHOOK_FORMATO` (BE-61): la única variante que se acepta. */
  readonly formato: FormatoWebhook;
  readonly escribirSms?: typeof escribirSmsDb;
}

/** 04 §15.2: best-effort, en su propia transacción [T]; nunca cambia la respuesta. */
async function anotar(d: DepsWebhook, e: NuevoEvento): Promise<void> {
  try {
    if (d.registrar) await d.registrar(e);
    else
      await (d.escribirTecnico ?? escribirTecnicoDb)(
        (tx) => registrarEvento(tx, e),
        d.opciones?.(),
      );
  } catch {
    // queda la respuesta
  }
}

const fallido = (d: DepsWebhook, mensaje: string, e: unknown): Promise<void> =>
  anotar(d, {
    nivel: 'error',
    origen: 'webhook',
    mensaje,
    datos: { ...sqlstateDe(e), idError: (d.nuevoIdError ?? idErrorAleatorio)() },
  });

export async function recibir(p: PeticionWebhook, d: DepsWebhook): Promise<RespuestaWebhook> {
  // Paso 1 (BE-59): el Route Handler corta el flujo al pasar el límite; aquí se repite la comprobación
  if (p.cuerpo.byteLength > LIMITE_CUERPO_BYTES) return { estado: 413 };
  // Paso 2 (N-01 punto 1): sin token válido no se guarda nada
  try {
    if (!(await autenticar(p.autorizacion, d))) {
      await anotar(d, { nivel: 'aviso', origen: 'webhook', mensaje: 'token_invalido' });
      return { estado: 401 };
    }
  } catch (e) {
    await fallido(d, 'guardar_fallido', e);
    return { estado: 503, reintentarEn: 30 };
  }
  // Paso 3 (BE-60): un cuerpo inválido también se guarda, crudo
  const leido = leerCuerpo(p.cuerpo, p.contentType, p.remitente, d.formato);
  // Paso 4 (N-01 punto 2): si no se guarda, 503 y MacroDroid reintenta
  let id: string;
  try {
    const fila = { texto: leido.texto, remitente: leido.remitente };
    id = (await (d.escribirSms ?? escribirSmsDb)((tx) => guardarSms(tx, fila), d.opciones?.())).id;
  } catch (e) {
    await fallido(d, 'guardar_fallido', e);
    return { estado: 503, reintentarEn: 30 };
  }
  const despues = (): Promise<void> => Promise.resolve();
  // Paso 5 (N-01 punto 3): guardado, siempre 200
  return { estado: 200, cuerpo: { recibido: true, id }, despues };
}
