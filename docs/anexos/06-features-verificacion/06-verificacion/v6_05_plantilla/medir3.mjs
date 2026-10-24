// V6-05 b: RTT aditivo. CDP trata `latency` como un mínimo (se solapa con el tiempo del servidor),
// así que el RTT de 150 ms se suma al servidor y la red solo limita el ancho de banda.
import { chromium } from 'playwright';
const URL = 'http://localhost:3107/plantilla';
const red = { latency: 0, downloadThroughput: 1638.4 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 };
const RTT = 150;
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const filas = [];
for (const [modo, servidorMs] of [['lote',50],['lote',150],['lote',400]]) {
  const corridas = [];
  for (let r = 0; r < 3; r++) {
    const ctx = await navegador.newContext(); const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(URL); await page.waitForFunction(() => typeof window.__reiniciar === 'function');
    await page.evaluate(() => window.__reiniciar()); await page.reload();
    await page.waitForFunction(() => typeof window.__aplicar === 'function');
    let bytes = 0;
    page.on('response', async (res) => { if (res.request().method() === 'POST') { try { bytes += (await res.body()).length; } catch {} } });
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, ...red });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const res = await page.evaluate(([s]) => window.__aplicar(s[0], s[1]), [[modo === 'lote' ? servidorMs : servidorMs + RTT, modo]]);
    await page.waitForTimeout(300);
    corridas.push({ ...res, bytes, creadas: await page.getByTestId('creadas').textContent() });
    await ctx.close();
  }
  corridas.sort((a, b) => a.totalMs - b.totalMs); const m = corridas[1];
  filas.push({ modo, servidorMs, rttMs: RTT, total_s: (m.totalMs / 1000).toFixed(1), min_s: (corridas[0].totalMs / 1000).toFixed(1),
    max_s: (corridas[2].totalMs / 1000).toFixed(1), p50_ms: Math.round(pct(m.llamadas, .5)), p95_ms: Math.round(pct(m.llamadas, .95)),
    respuesta_media_kb: (m.bytes / 1000).toFixed(1), creadas: m.creadas });
}
console.table(filas); await navegador.close();
