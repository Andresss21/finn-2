// Comprobación de V-01 / ACT-25 / ACT-28: ¿«Editar transacción» abre sin campos, o la captura salió antes de que cargara el
// trozo `edicion` (lazy con `Suspense fallback={null}`)? Mide cuántos campos hay a 0, 1, 3 y 8 s, entrando por el enlace
// (navegación del cliente) y por URL directa (HTML del servidor). Salida: docs/auditoria-diseno/verificacion/editar-tx.json
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SALIDA, entrar, escenarioA7, quieta, sembrarEscenario, test, type Page } from '../lib.ts';

const campos = (page: Page) =>
  page.evaluate(() => document.querySelectorAll('main input, main select, main textarea').length);

test('editar transaccion: campos en el tiempo', async ({ page, context, baseURL }, info) => {
  test.skip(info.project.name !== 'telefono-claro', 'solo teléfono');
  test.setTimeout(180_000);
  await sembrarEscenario(escenarioA7(), '2026-10-15');
  await entrar(context, baseURL);
  const r: Record<string, unknown> = {};
  // 1) por el enlace, como el caso de la auditoría
  await page.goto('/actividad');
  await quieta(page);
  const href = await page.locator('a[href*="/actividad/"]').first().getAttribute('href');
  await page.goto(href ?? '/actividad');
  await quieta(page);
  const t0 = Date.now();
  await page.getByRole('link', { name: 'Editar' }).click();
  await page.waitForURL('**/editar**');
  const enlace: Record<string, number> = {};
  for (const ms of [0, 1000, 3000, 8000]) {
    await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    enlace[`${ms}ms`] = await campos(page);
  }
  r['porEnlace'] = enlace;
  await page.screenshot({ path: join(SALIDA, 'verificacion', 'editar-tx__enlace-8s.png') });
  // 2) por URL directa
  const url = page.url();
  await page.goto(url);
  const directa: Record<string, number> = { carga: await campos(page) };
  await quieta(page);
  directa['quieta'] = await campos(page);
  await page.waitForTimeout(3000);
  directa['3s'] = await campos(page);
  r['porUrl'] = directa;
  r['url'] = url.replace(/^https?:\/\/[^/]+/, '');
  await page.screenshot({ path: join(SALIDA, 'verificacion', 'editar-tx__url.png') });
  writeFileSync(join(SALIDA, 'verificacion', 'editar-tx.json'), JSON.stringify(r, null, 1));
});
