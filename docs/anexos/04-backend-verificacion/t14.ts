import { decodificar, leerCsv } from './conc/decodificar.ts';
import iconv from 'iconv-lite';
import { createHmac, timingSafeEqual } from 'node:crypto';
const contenido = 'Detalle de Estado Bancario\nSaldo Inicial,"1,234.50"\nFecha,Descripción,Débito,Crédito\n05/10/2026,"PAGO, TARJETA ÑANDÚ",45.00,\n06/10/2026,Depósito,,100.00\n';
const casos: [string, Uint8Array][] = [
  ['UTF-8 sin BOM', new TextEncoder().encode(contenido)],
  ['UTF-8 con BOM', new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(contenido)])],
  ['Windows-1252', new Uint8Array(iconv.encode(contenido, 'win1252'))],
  ['ASCII puro', new TextEncoder().encode('Autorizacion,Fecha Transaccion\n123,01/10/2026\n')],
];
for (const [n, b] of casos) {
  const d = decodificar(b); const r = leerCsv(d.texto);
  const fila = r.data.find(f => f[1]?.includes('PAGO'));
  console.log(n.padEnd(14), '→', d.codificacion, 'BOM', d.bom, '| primera celda:', JSON.stringify(r.data[0][0]), '| encabezado:', JSON.stringify(r.data[2]?.[1] ?? r.data[0]?.[1]), '| fila con coma entre comillas:', JSON.stringify(fila ?? null), '| errores:', r.errors.length);
}
// Un archivo Windows-1252 que por azar es UTF-8 válido: "Ã³" (0xC3 0xB3) en 1252 se lee como "ó" en UTF-8
const ambiguo = new Uint8Array(iconv.encode('DescripciÃ³n', 'win1252'));
console.log('Ambiguo (1252 "Ã³" = bytes UTF-8 de "ó") →', JSON.stringify(decodificar(ambiguo)));

// HMAC de la carga de conciliación (P4-14)
const claves: Record<string, Buffer> = { k1: Buffer.alloc(32, 1), k2: Buffer.alloc(32, 2) };
const canon = (v: any): string => Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',')}}` : JSON.stringify(v);
function firmar(version: string, carga: object) {
  const cuerpo = Buffer.from(canon({ ...carga, v: version })).toString('base64url');
  const mac = createHmac('sha256', claves[version]).update(`finn-conciliacion.${version}.${cuerpo}`).digest('base64url');
  return `${version}.${cuerpo}.${mac}`;
}
function verificar(token: string, cuentaId: string, ahoraMs: number) {
  const [version, cuerpo, mac] = token.split('.');
  const clave = claves[version]; if (!clave) return 'version_desconocida';
  const esperado = createHmac('sha256', clave).update(`finn-conciliacion.${version}.${cuerpo}`).digest();
  const recibido = Buffer.from(mac, 'base64url');
  if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado)) return 'firma_no_valida';
  const c = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
  if (c.cuentaId !== cuentaId) return 'firma_no_valida';
  if (ahoraMs > c.vence) return 'firma_vencida';
  return 'ok';
}
const ahora = Date.parse('2026-10-14T20:00:00Z');
const carga = { cuentaId: 'c-1', vence: ahora + 24 * 3600e3, formato: 'bac_debito', fechaEstado: '2026-10-13', saldoFinal: 123450, movimientos: [{ i: 0, fecha: '2026-10-05', monto: -4500, descripcion: 'PAGO, TARJETA' }] };
const t = firmar('k2', carga);
const alterado = (() => { const [v, c, m] = t.split('.'); const o = JSON.parse(Buffer.from(c, 'base64url').toString()); o.movimientos[0].monto = -450; return `${v}.${Buffer.from(canon(o)).toString('base64url')}.${m}`; })();
console.log('HMAC válida:', verificar(t, 'c-1', ahora), '| otra cuenta:', verificar(t, 'c-2', ahora), '| monto alterado:', verificar(alterado, 'c-1', ahora),
  '| a las 24 h + 1 ms:', verificar(t, 'c-1', ahora + 24 * 3600e3 + 1), '| firmada con k1 tras rotar a k2:', verificar(firmar('k1', carga), 'c-1', ahora), '| versión retirada:', verificar(t.replace(/^k2/, 'k9'), 'c-1', ahora), '| bytes del token:', t.length);
