// V6-08: carga diferida de la librería de arrastre en la Bandeja (FT-78) y funcionamiento con ratón, teclado y tacto.
import { chromium } from 'playwright';
const B = 'http://localhost:3107';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function medir(ruta) {
  const ctx = await nav.newContext(); const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1638.4 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const js = []; const t0 = Date.now();
  cdp.on('Network.loadingFinished', (e) => { const r = pedidos.get(e.requestId); if (r) js.push({ ...r, bytes: e.encodedDataLength, fin: Date.now() - t0 }); });
  const pedidos = new Map();
  cdp.on('Network.responseReceived', (e) => { if (e.type === 'Script') pedidos.set(e.requestId, { url: e.response.url.replace(B, ''), enc: e.response.headers['content-encoding'] ?? e.response.headers['Content-Encoding'] }); });
  await page.goto(B + ruta, { waitUntil: 'load' });
  const cargaMs = Date.now() - t0;
  await page.waitForTimeout(4000);
  const marcas = await page.evaluate(() => ({ hidratado: window.__hidratado, pedido: window.__arrastrePedido, listo: window.__arrastreListo }));
  await ctx.close();
  return { ruta, cargaMs, js, marcas };
}
const control = await medir('/control'); const sin = await medir('/bandeja?sinArrastre=1'); const con = await medir('/bandeja');
const suma = (l) => l.reduce((a, x) => a + x.bytes, 0);
const enInicial = (r) => r.js.filter((x) => x.fin <= r.cargaMs + 50);
const nuevos = con.js.filter((x) => !sin.js.some((y) => y.url === x.url));
console.log('Codificación:', [...new Set(con.js.map((x) => x.enc))]);
console.log({ controlKB: (suma(control.js) / 1000).toFixed(1), bandejaSinArrastreKB: (suma(sin.js) / 1000).toFixed(1), bandejaConArrastreKB: (suma(con.js) / 1000).toFixed(1) });
console.log('JS de la ruta (Bandeja − control, carga inicial):', ((suma(sin.js) - suma(control.js)) / 1000).toFixed(1), 'KB');
console.log('Trozo diferido (solo con arrastre):', nuevos.map((x) => `${x.url} ${(x.bytes / 1000).toFixed(1)} KB`));
console.log('¿El trozo diferido llega antes del evento load?', nuevos.some((x) => x.fin <= con.cargaMs), '| load', con.cargaMs, 'ms; marcas (ms desde navegación):', con.marcas);

// Funcionamiento
const ctx = await nav.newContext(); const page = await ctx.newPage();
await page.goto(B + '/bandeja'); await page.waitForFunction(() => window.__arrastreListo);
// 1) Ratón
const asa = page.getByTestId('asa-m2'); const b = await asa.boundingBox();
await page.mouse.move(b.x + 5, b.y + 5); await page.mouse.down(); await page.mouse.move(b.x + 20, b.y + 20, { steps: 4 });
await page.getByTestId('panel-destinos').waitFor();
const d = await page.getByTestId('destino-c-rest').boundingBox();
await page.mouse.move(d.x + 20, d.y + 10, { steps: 8 }); await page.mouse.up();
await page.waitForFunction(() => document.querySelector('[data-testid=fila-m2]')?.textContent?.startsWith('Aprobado'));
console.log('Ratón:', await page.getByTestId('fila-m2').textContent());
// 2) Teclado
await page.getByTestId('asa-m3').focus(); await page.keyboard.press('Space');
await page.getByTestId('panel-destinos').waitFor();
let sobre = false;
for (let i = 0; i < 60 && !sobre; i++) {
  const r = await page.getByTestId('asa-m3').evaluate(() => 0); // no-op
  const dd = await page.getByTestId('destino-c-super').boundingBox();
  const over = await page.locator('[data-sobre]').count();
  if (over) { sobre = true; break; }
  const p = await page.evaluate(() => { const o = document.querySelector('[data-dnd-kit-drag-overlay], [style*="transform"]'); return null; });
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(50);
}
const anuncio = await page.locator('[id^="DndLiveRegion"]').allTextContents();
await page.keyboard.press('Space');
await page.waitForTimeout(500);
console.log('Teclado: llegó a un destino:', sobre, '| fila:', await page.getByTestId('fila-m3').textContent(), '| anuncio:', anuncio.join(' / ').slice(0, 160));
// 3) Escape cancela
await page.getByTestId('asa-m4').focus(); await page.keyboard.press('Space'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
console.log('Escape: fila m4 sigue sin aprobar:', !(await page.getByTestId('fila-m4').textContent()).startsWith('Aprobado'));
await ctx.close();
// 4) Tacto: desplazamiento corto no inicia el arrastre; pulsación larga sí
const tctx = await nav.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }); const tp = await tctx.newPage();
const tcdp = await tctx.newCDPSession(tp);
await tp.goto(B + '/bandeja'); await tp.waitForFunction(() => window.__arrastreListo);
const tb = await tp.getByTestId('asa-m6').boundingBox(); const x = tb.x + 10, y = tb.y + 10;
const toque = (type, pts) => tcdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
await toque('touchStart', [{ x, y }]); await tp.waitForTimeout(100); await toque('touchMove', [{ x, y: y - 60 }]); await toque('touchEnd', []);
await tp.waitForTimeout(300);
const panelTrasDesplazar = await tp.getByTestId('panel-destinos').count();
const desplazo = await tp.evaluate(() => window.scrollY);
const tb2 = await tp.getByTestId('asa-m6').boundingBox(); const x2 = tb2.x + 10, y2 = tb2.y + 10;
await toque('touchStart', [{ x: x2, y: y2 }]); await tp.waitForTimeout(500);
const panelTrasPulsar = await tp.getByTestId('panel-destinos').count();
const td = await tp.getByTestId('destino-c-gas').boundingBox().catch(() => null);
console.log('Tacto: destino visible:', !!td);
if (td) { await toque('touchMove', [{ x: td.x + 20, y: td.y + 10 }]); await tp.waitForTimeout(100); await toque('touchMove', [{ x: td.x + 22, y: td.y + 12 }]); await tp.waitForTimeout(100); console.log('Tacto: sobre destino:', await tp.locator('[data-sobre]').count()); }
await toque('touchEnd', []); await tp.waitForTimeout(600); console.log('Tacto: anuncio final:', (await tp.locator('[id^="DndLiveRegion"]').allTextContents()).join(' / '));
console.log('Tacto: la lista se desplazó', desplazo, 'px; panel tras desplazar 60 px en 100 ms:', panelTrasDesplazar, '| panel tras pulsar 500 ms:', panelTrasPulsar, '| fila:', await tp.getByTestId('fila-m6').textContent());
await nav.close();
