// Contrato del cuerpo del webhook (04 §8.1, §8.1.1, §8.2 paso 3; BE-59, BE-60, BE-61). Portado del prototipo
// verificado en V-27 (docs/anexos/04-backend-verificacion/webhook/cuerpo.ts), con el esquema en Zod. Solo acepta
// la variante activa (`FINN_WEBHOOK_FORMATO`); un cuerpo inválido no es un 400: se guarda crudo (BE-60).
import { z } from 'zod';

export type FormatoWebhook = 'json' | 'texto';
export type DetalleCuerpo = 'utf8_invalido' | 'content_type' | 'json_invalido' | 'esquema';
export type CuerpoLeido =
  | { readonly valido: true; readonly texto: string; readonly remitente: string }
  | {
      readonly valido: false;
      readonly texto: string;
      readonly remitente: 'desconocido';
      readonly detalle: DetalleCuerpo;
    };

/** BE-59: el SMS más largo (2.000 caracteres) cabe holgado. */
export const LIMITE_CUERPO_BYTES = 16 * 1024;
const MAX_TEXTO = 2000;
const MAX_REMITENTE = 100;

// `char_length` de Postgres cuenta puntos de código, no unidades UTF-16 (03 §3.17)
const largo = (s: string): number => Array.from(s).length;

/** Sin NUL (Postgres no lo admite en `text`, 22021) y recortado a `max` puntos de código. */
const limpiar = (s: string, max: number): string => {
  const sinNul = s.replace(/\u0000/g, '');
  return largo(sinNul) > max ? Array.from(sinNul).slice(0, max).join('') : sinNul;
};

const texto = z.string().refine((t) => t !== '' && largo(t) <= MAX_TEXTO && !t.includes('\u0000'));
/** Texto limpio (04 §3.0.4): sin caracteres de control y sin espacios en los extremos, de 1 a 100. */
const remitente = z
  .string()
  .transform((r) =>
    limpiar(r, MAX_REMITENTE * 4)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim(),
  )
  .refine((r) => r !== '' && largo(r) <= MAX_REMITENTE);
/** Variante A: los campos extra se ignoran; sin compatibilidad con `{ "sms": … }` de la 1.0. */
const cuerpoJson = z.object({ texto, remitente });

/** BE-60: el crudo como UTF-8 no estricto (bytes inválidos → U+FFFD); vacío → `(cuerpo vacío)`. */
function invalido(bytes: Uint8Array, detalle: DetalleCuerpo): CuerpoLeido {
  const crudo = limpiar(new TextDecoder('utf-8', { fatal: false }).decode(bytes), MAX_TEXTO);
  return {
    valido: false,
    texto: crudo === '' ? '(cuerpo vacío)' : crudo,
    remitente: 'desconocido',
    detalle,
  };
}

/** La fila de `sms_recibidos` de una petición con token válido: siempre una que la base admite. */
export function leerCuerpo(
  bytes: Uint8Array,
  contentType: string | null,
  cabeceraRemitente: string | null,
  formato: FormatoWebhook,
): CuerpoLeido {
  const tipo = (contentType ?? '').split(';')[0]?.trim().toLowerCase();
  let cuerpo: string;
  try {
    cuerpo = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return invalido(bytes, 'utf8_invalido');
  }
  if (tipo !== (formato === 'json' ? 'application/json' : 'text/plain'))
    return invalido(bytes, 'content_type');
  let datos: unknown = { texto: cuerpo, remitente: cabeceraRemitente };
  if (formato === 'json')
    try {
      datos = JSON.parse(cuerpo);
    } catch {
      return invalido(bytes, 'json_invalido');
    }
  const r = cuerpoJson.safeParse(datos);
  return r.success ? { valido: true, ...r.data } : invalido(bytes, 'esquema');
}

/** La entrada de OP-35 en el marco (04 §8.4 c): el SMS ya guardado. */
export const entradaOp35 = z.object({ smsId: z.uuid() });
export type EntradaOp35 = z.infer<typeof entradaOp35>;
