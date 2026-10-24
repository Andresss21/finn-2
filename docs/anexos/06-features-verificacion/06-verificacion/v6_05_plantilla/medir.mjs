// V6-05: 47 creaciones secuenciales por Server Action (una por elemento de la plantilla)
import { chromium } from 'playwright';
const URL = 'http://localhost:3107/plantilla';
const perfiles = {
  local: null,
  '4g-lenta': { latency: 150, downloadThroughput: 1638.4 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 }, // Lighthouse móvil (05 §13.1)
};
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const filas = [];
for (const [nombre, red] of Object.entries(perfiles)) {
  for (const servidorMs of [0, 150, 400]) {
    for (const modo of ['cada', 'final']) {
      const corridas = [];
      for (let r = 0; r < 3; r++) {
        const ctx = await navegador.newContext(); const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        await page.goto(URL); await page.waitForFunction(() => typeof window.__reiniciar === 'function'); await page.evaluate(() => window.__reiniciar()); await page.reload();
        await page.waitForFunction(() => typeof window.__aplicar === 'function');
        if (red) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, ...red }); }
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        const res = await page.evaluate(([s, m]) => window.__aplicar(s, m), [servidorMs, modo]);
        const creadas = await page.getByTestId('creadas').textContent();
        corridas.push({ ...res, creadas });
        await ctx.close();
      }
      corridas.sort((a, b) => a.totalMs - b.totalMs);
      const med = corridas[1];
      filas.push({ red: nombre, servidorMs, modo, total_s: (med.totalMs / 1000).toFixed(1),
        min_s: (corridas[0].totalMs / 1000).toFixed(1), max_s: (corridas[2].totalMs / 1000).toFixed(1),
        p50_ms: Math.round(pct(med.llamadas, .5)), p95_ms: Math.round(pct(med.llamadas, .95)), creadas: med.creadas });
    }
  }
}
console.table(filas);
await navegador.close();
