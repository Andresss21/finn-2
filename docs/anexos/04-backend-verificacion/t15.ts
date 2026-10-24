// V-27: cuerpo inválido con token válido (BE-60) y variantes del contrato (BE-61), contra las CHECK de 03 §3.17
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { leerCuerpo, type FormatoWebhook } from './webhook/cuerpo.ts';
const db = new pg.Client({ host: '/tmp', port: 5433, user: 'postgres', database: 'finn' });
await db.connect();
const enc = (s: string) => new TextEncoder().encode(s);
const smsConComillas = 'BAC: Compra de "SUPER" aprobada\nTarjeta 1234\tMonto $12.30';
type Caso = [string, FormatoWebhook, Uint8Array, string | null, string | null, boolean, string?];
const casos: Caso[] = [
  ['W-01 JSON válido', 'json', enc(JSON.stringify({ texto: smsConComillas, remitente: 'BAC' })), 'application/json', null, true],
  ['W-02 JSON sin escapar (comillas y salto)', 'json', enc(`{"texto":"${smsConComillas}","remitente":"BAC"}`), 'application/json', null, false, 'json_invalido'],
  ['W-03 JSON sin remitente', 'json', enc('{"texto":"hola"}'), 'application/json', null, false, 'esquema'],
  ['W-04 cuerpo vacío', 'json', new Uint8Array(0), 'application/json', null, false, 'json_invalido'],
  ['W-05 3.000 car. con emojis (crudo)', 'json', enc('{"texto":"' + '😀'.repeat(3000)), 'application/json', null, false, 'json_invalido'],
  ['W-06 NUL en el crudo', 'json', enc('{"texto":"a\u0000b"'), 'application/json', null, false, 'json_invalido'],
  ['W-07 UTF-8 inválido', 'json', new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]), 'application/json', null, false, 'utf8_invalido'],
  ['W-08 texto/plain en variante JSON', 'json', enc(smsConComillas), 'text/plain', 'BAC', false, 'content_type'],
  ['W-09 variante texto válida', 'texto', enc(smsConComillas), 'text/plain; charset=utf-8', 'BAC', true],
  ['W-10 variante texto sin cabecera', 'texto', enc(smsConComillas), 'text/plain', null, false, 'esquema'],
  ['W-11 JSON en variante texto', 'texto', enc(JSON.stringify({ texto: 'x', remitente: 'BAC' })), 'application/json', 'BAC', false, 'content_type'],
  ['W-12 variante texto vacía', 'texto', new Uint8Array(0), 'text/plain', 'BAC', false, 'esquema'],
];
let fallos = 0;
for (const [nombre, formato, bytes, ct, rem, esperaValido, esperaDetalle] of casos) {
  const r = leerCuerpo(bytes, ct, rem, formato);
  let guardado = 'ok';
  try {
    await db.query('INSERT INTO finn.sms_recibidos (id, texto, remitente) VALUES ($1,$2,$3)', [randomUUID(), r.texto, r.remitente]);
  } catch (e: any) { guardado = 'RECHAZADO ' + e.code; }
  const ok = r.valido === esperaValido && (esperaDetalle === undefined || r.detalle === esperaDetalle) && guardado === 'ok'
    && (r.valido || r.remitente === 'desconocido');
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'} ${nombre}: valido=${r.valido} detalle=${r.detalle ?? '-'} car=${Array.from(r.texto).length} guardado=${guardado}`);
}
// La base rechaza NUL y >2000 si no se limpian (justifica la limpieza)
for (const [n, t] of [['NUL sin limpiar', 'a\u0000b'], ['2001 car. sin recortar', 'x'.repeat(2001)], ['vacío sin marcador', '']] as const) {
  try { await db.query('INSERT INTO finn.sms_recibidos (id, texto, remitente) VALUES ($1,$2,$3)', [randomUUID(), t, 'x']); console.log(`MAL ${n}: aceptado`); fallos++; }
  catch (e: any) { console.log(`OK  control ${n}: rechazado ${e.code}`); }
}
console.log(fallos ? `FALLOS: ${fallos}` : 'TODO OK');
await db.end();
