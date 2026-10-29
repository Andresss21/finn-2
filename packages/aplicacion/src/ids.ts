// Identificadores de las filas que crea una operación (04 §2.4.1, BE-31). La aplicación fija todos los `id`; el
// dominio solo llama al `GeneradorIds` que recibe. UUIDv5 usa SHA-1 (`node:crypto`), por eso vive aquí y no en el
// dominio (ADR-07, ADR-21).
import { createHash, randomUUID } from 'node:crypto';
import type { GeneradorIds, Uuid } from '@finn/dominio';

const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUIDv5 (RFC 9562 §5.5): SHA-1 de `espacio` (16 bytes) y `nombre` (UTF-8); versión 5 y variante 10. */
export function uuidv5(nombre: string, espacio: string): Uuid {
  if (!FORMA_UUID.test(espacio))
    throw new Error(`uuidv5: el espacio de nombres no es un UUID: ${espacio}`);
  const bytes = createHash('sha1')
    .update(Buffer.from(espacio.replaceAll('-', ''), 'hex'))
    .update(nombre, 'utf8')
    .digest()
    .subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const h = bytes.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` as Uuid;
}

/**
 * Con id principal (operaciones de clase creación, 04 §4.6): determinista. El nombre es el índice 1, 2, 3… en el
 * orden en que el dominio pide ids y el espacio de nombres es el id principal; previsualizar, confirmar y cada
 * reintento producen los mismos ids.
 */
export const generadorDerivado = (principal: Uuid): GeneradorIds => {
  let indice = 0;
  return { siguiente: () => uuidv5(String(++indice), principal) };
};

/** Sin id principal (por ejemplo, la primera asignación de una celda): aleatorio. Sus ids no entran en la huella. */
export const generadorAleatorio = (): GeneradorIds => ({
  siguiente: () => randomUUID() as Uuid,
});
