// Prototipo de 8.2 paso 3 (BE-60, BE-61): convierte la petición en la fila a guardar.
export type FormatoWebhook = 'json' | 'texto';
export interface CuerpoLeido { texto: string; remitente: string; valido: boolean; detalle?: string }

const MAX_TEXTO = 2000, MAX_REMITENTE = 100;
const VACIO = '(cuerpo vacío)';

/** Recorta por puntos de código (lo que cuenta char_length de Postgres) y quita NUL, que text no admite. */
export function limpiarTexto(s: string, max: number): string {
  const sinNul = s.replace(/\u0000/g, '');
  const cps = Array.from(sinNul);
  return cps.length > max ? cps.slice(0, max).join('') : sinNul;
}
function remitenteLimpio(r: unknown): string | null {
  if (typeof r !== 'string') return null;
  const t = limpiarTexto(r, MAX_REMITENTE * 4).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return t.length >= 1 && Array.from(t).length <= MAX_REMITENTE ? t : null;
}
function invalido(bytes: Uint8Array, detalle: string): CuerpoLeido {
  const crudo = new TextDecoder('utf-8', { fatal: false }).decode(bytes);   // bytes inválidos → U+FFFD
  const texto = limpiarTexto(crudo, MAX_TEXTO);
  return { texto: texto.length ? texto : VACIO, remitente: 'desconocido', valido: false, detalle };
}

export function leerCuerpo(bytes: Uint8Array, contentType: string | null, cabRemitente: string | null, formato: FormatoWebhook): CuerpoLeido {
  const tipo = (contentType ?? '').split(';')[0].trim().toLowerCase();
  let texto: string;
  try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return invalido(bytes, 'utf8_invalido'); }
  if (formato === 'json') {
    if (tipo !== 'application/json') return invalido(bytes, 'content_type');
    let obj: unknown;
    try { obj = JSON.parse(texto); } catch { return invalido(bytes, 'json_invalido'); }
    if (typeof obj !== 'object' || obj === null) return invalido(bytes, 'esquema');
    const o = obj as Record<string, unknown>;
    const rem = remitenteLimpio(o.remitente);
    if (typeof o.texto !== 'string' || o.texto.length === 0 || Array.from(o.texto).length > MAX_TEXTO || o.texto.includes('\u0000') || !rem)
      return invalido(bytes, 'esquema');
    return { texto: o.texto, remitente: rem, valido: true };
  }
  if (tipo !== 'text/plain') return invalido(bytes, 'content_type');
  const rem = remitenteLimpio(cabRemitente);
  if (texto.length === 0 || Array.from(texto).length > MAX_TEXTO || texto.includes('\u0000') || !rem) return invalido(bytes, 'esquema');
  return { texto, remitente: rem, valido: true };
}
