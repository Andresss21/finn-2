// PRU-E2E-RELOJ-001..003 (prototipo de V7-04)
import { test, expect } from '@playwright/test';
import { fijarReloj } from './reloj';
test('PRU-E2E-RELOJ-001 el servidor sigue el archivo del reloj en cada petición, sin reiniciar', async ({ request }) => {
  fijarReloj('2027-02-20T19:00:00-06:00');
  expect((await (await request.get('/api/eco')).json()).hoy).toBe('2027-02-20');
  fijarReloj('2027-02-21T08:00:00-06:00');
  expect((await (await request.get('/api/eco')).json()).hoy).toBe('2027-02-21');
});
test('PRU-E2E-RELOJ-002 RT-21: la pantalla abierta pasa al día siguiente a medianoche sin recargar (05 §6.7)', async ({ page }) => {
  fijarReloj('2027-02-20T23:59:50-06:00');
  await page.clock.install({ time: new Date('2027-02-20T23:59:50-06:00') });
  await page.goto('/');
  await expect(page.getByTestId('hoy')).toHaveText('2027-02-20');
  await page.evaluate(() => { (window as any).__marca = 'sin-recarga'; });
  fijarReloj('2027-02-21T00:00:06-06:00');                       // el servidor ya cambió de día
  await page.clock.fastForward('00:20');                         // el navegador llega a 00:00:05 + margen
  await expect(page.getByTestId('hoy')).toHaveText('2027-02-21');
  expect(await page.evaluate(() => (window as any).__marca)).toBe('sin-recarga');
});
test('PRU-E2E-RELOJ-003 hallazgo: next start corre con NODE_ENV=production; el guardia no puede depender de NODE_ENV', async ({ page }) => {
  fijarReloj('2027-02-20T12:00:00-06:00');
  await page.goto('/');
  await expect(page.getByTestId('entorno')).toHaveText('production|∅|reloj-prueba');
});
