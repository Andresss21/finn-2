import { interpretar, type Formato } from './sms/interpretar.ts';
import { checkSync } from 'recheck';
// Patrones tal como quedan guardados en 03 §9.5 (literal SQL estándar → la cadena tiene las barras tal cual)
const F: Formato[] = [
  { id: 'F-1', nombre: 'BAC compra', tipoMovimiento: 'compra', banderas: 'i', montoSeparadorMiles: ',', montoSeparadorDecimal: '.', formatosFecha: ['AAAA/MM/DD', 'AAAAMMDD'], activo: true,
    patron: String.raw`(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})` },
  { id: 'F-2', nombre: 'Banco Agrícola compra', tipoMovimiento: 'compra', banderas: 'i', montoSeparadorMiles: ',', montoSeparadorDecimal: '.', formatosFecha: ['AAAA/MM/DD', 'AAAAMMDD'], activo: true,
    patron: String.raw`\((?<ultimos4>\d{4})\).*?USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})` },
  { id: 'F-3', nombre: 'Cuscatlán compra', tipoMovimiento: 'compra', banderas: 'i', montoSeparadorMiles: ',', montoSeparadorDecimal: '.', formatosFecha: ['AAAA-MM-DD'], activo: true,
    patron: String.raw`Titular\s+(?<ultimos4>\d{4})\s+por\s+USD(?<monto>[\d,]+\.?\d*)\s+en\s+(?<comercio>.+?)\s+el\s+(?<fecha>\d{4}-\d{2}-\d{2})` },
];
const casos: [string, string, string][] = [
  ['S-01 BAC con dos puntos, AAAA/MM/DD', 'BAC Credomatic: VISA 1234: has realizado una compra por USD 1,234.50 en el comercio: SUPER SELECTOS ESCALON 2026/10/12 14:32', 'F-1 123450 SUPER SELECTOS ESCALON 2026-10-12'],
  ['S-02 BAC sin dos puntos, AAAAMMDD', 'MASTERCARD 4321: has realizado una compra por USD12.3 en el comercio PIZZA  HUT   STA ELENA 20261012', 'F-1 1230 PIZZA HUT STA ELENA 2026-10-12'],
  ['S-03 Agrícola', 'Banco Agricola: Tu tarjeta (5678) registro compra por USD 45.00 en el comercio GASOLINERA UNO 2026/10/01', 'F-2 4500 GASOLINERA UNO 2026-10-01'],
  ['S-04 Cuscatlán', 'Cuscatlan: Compra con tarjeta Titular 9012 por USD7.99 en STARBUCKS MULTIPLAZA el 2026-10-12', 'F-3 799 STARBUCKS MULTIPLAZA 2026-10-12'],
  ['S-05 monto con punto final "12."', 'VISA 1234: has realizado una compra por USD 12. en el comercio X 2026/10/12', 'no_reconocido ninguno'],
  ['S-06 monto con 3 decimales', 'VISA 1234: has realizado una compra por USD 12.345 en el comercio X 2026/10/12', 'no_reconocido ninguno'],
  ['S-07 monto cero', 'VISA 1234: has realizado una compra por USD 0.00 en el comercio X 2026/10/12', 'no_reconocido ninguno'],
  ['S-08 fecha inexistente', 'VISA 1234: has realizado una compra por USD 10.00 en el comercio X 2026/02/30', 'no_reconocido ninguno'],
  ['S-09 comercio con forma de fecha (riesgo conocido de 03 §9.5, puntos 2 y 4)', 'VISA 1234: has realizado una compra por USD 10.00 en el comercio TIENDA 20261001 CENTRO 2026/10/12', 'F-1 1000 TIENDA 2026-10-01'],
  ['S-10 texto con paréntesis de 4 dígitos que coincide con F-1 y F-2', 'Aviso (1234) VISA 1234: has realizado una compra por USD 10.00 en el comercio X 2026/10/12', 'no_reconocido varios'],
  ['S-13 comercio con (5555) solo coincide con F-1', 'VISA 1234: has realizado una compra por USD 10.00 en el comercio CAJA (5555) 2026/10/12', 'F-1 1000 CAJA (5555) 2026-10-12'],
  ['S-11 mensaje sin movimiento', 'BAC: Tu codigo de verificacion es 123456', 'no_reconocido ninguno'],
  ['S-12 minúsculas (bandera i)', 'visa 1234: has realizado una compra por usd 5.00 en el comercio x 2026/10/12', 'F-1 500 x 2026-10-12'],
];
let fallas = 0;
for (const [n, t, esp] of casos) {
  const r = interpretar(t, F);
  const got = r.resultado === 'reconocido' ? `${r.formatoId} ${r.campos.monto} ${r.campos.comercio} ${r.campos.fecha}` : `no_reconocido ${r.motivo}`;
  const ok = got === esp; if (!ok) fallas++;
  console.log(ok ? 'ok  ' : 'FALLA', n, '→', got, ok ? '' : `(esperado: ${esp})`, r.coincidentes.length > 1 ? `[coinciden: ${r.coincidentes}]` : '');
}
console.log('fallas:', fallas);
const largo = 'VISA 1234: has realizado una compra por USD 1.00 en el comercio ' + 'A '.repeat(960);
const t0 = performance.now(); for (let i = 0; i < 100; i++) interpretar(largo, F); console.log('100 × SMS normal de', largo.length, 'caracteres sin fecha:', Math.round(performance.now() - t0), 'ms');
