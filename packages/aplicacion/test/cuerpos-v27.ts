// Los 12 cuerpos de V-27 (04 §8.2, BE-60; prototipo docs/anexos/04-backend-verificacion/t15.ts), compartidos por
// PRU-CTR-BAND-001 (sin base) y PRU-INT-BAND-001 (contra las CHECK de 03 §3.17).
import type { FormatoWebhook } from '../src/contratos/webhook.ts';

export const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
export const SMS = 'BAC: Compra de "SUPER" aprobada\nTarjeta 1234\tMonto $12.30';
export const JSON_CT = 'application/json';

type Caso = readonly [
  nombre: string,
  formato: FormatoWebhook,
  cuerpo: Uint8Array,
  contentType: string | null,
  remitente: string | null,
  detalle: string | null, // null: válido
];

/** Los 12 casos de V-27 (04 §8.2, BE-60). */
export const CUERPOS_V27: readonly Caso[] = [
  [
    'W-01 JSON válido',
    'json',
    enc(JSON.stringify({ texto: SMS, remitente: 'BAC' })),
    JSON_CT,
    null,
    null,
  ],
  [
    'W-02 JSON sin escapar',
    'json',
    enc(`{"texto":"${SMS}","remitente":"BAC"}`),
    JSON_CT,
    null,
    'json_invalido',
  ],
  ['W-03 JSON sin remitente', 'json', enc('{"texto":"hola"}'), JSON_CT, null, 'esquema'],
  ['W-04 cuerpo vacío', 'json', new Uint8Array(0), JSON_CT, null, 'json_invalido'],
  [
    'W-05 3.000 emojis',
    'json',
    enc(`{"texto":"${'😀'.repeat(3000)}`),
    JSON_CT,
    null,
    'json_invalido',
  ],
  ['W-06 NUL en el crudo', 'json', enc('{"texto":"a\u0000b"'), JSON_CT, null, 'json_invalido'],
  [
    'W-07 UTF-8 inválido',
    'json',
    new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]),
    JSON_CT,
    null,
    'utf8_invalido',
  ],
  ['W-08 texto en la variante JSON', 'json', enc(SMS), 'text/plain', 'BAC', 'content_type'],
  ['W-09 variante texto válida', 'texto', enc(SMS), 'text/plain; charset=utf-8', 'BAC', null],
  ['W-10 variante texto sin cabecera', 'texto', enc(SMS), 'text/plain', null, 'esquema'],
  [
    'W-11 JSON en la variante texto',
    'texto',
    enc('{"texto":"x","remitente":"BAC"}'),
    JSON_CT,
    'BAC',
    'content_type',
  ],
  ['W-12 variante texto vacía', 'texto', new Uint8Array(0), 'text/plain', 'BAC', 'esquema'],
];

/** Lo que piden las `CHECK` de `sms_recibidos` (03 §3.17) y el tipo `text` de Postgres. */
export const cumpleCheck = (f: { texto: string; remitente: string }): boolean => {
  const largo = Array.from(f.texto).length;
  return largo >= 1 && largo <= 2000 && !f.texto.includes('\u0000') && f.remitente !== '';
};
