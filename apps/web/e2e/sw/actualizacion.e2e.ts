// PRU-SW-PWA-004 (TA-223; 05 §8.4, FE-55; V5-33): con una versión nueva instalada la pestaña vieja sigue funcionando
// con el precache de su versión, muestra el aviso y "Recargar" activa la nueva. La "versión 2" la publica el servidor
// intermedio cambiando los bytes de `sw.js`; el archivo que la versión nueva "ya no tiene" responde 404 (V5-33b).
import { expect, test } from '@playwright/test';
import { formularios } from '../../src/textos/formularios.ts';
import { contenidoDeLasCaches, visitarControlada } from './ayudas-sw.ts';
import { levantarServidorIntermedio } from './servidor-intermedio.ts';

test.describe('PRU-SW-PWA', () => {
  test.use({ serviceWorkers: 'allow' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

  test('PRU-SW-PWA-004 [V5-33] con la versión 2 instalada la pestaña con la versión 1 muestra el aviso, sigue sirviendo sus archivos y "Recargar" activa la versión 2', async ({
    page,
    baseURL,
  }) => {
    const intermedio = await levantarServidorIntermedio(baseURL ?? '');
    try {
      await visitarControlada(page, `${intermedio.origen}/sin-conexion`);
      const aviso = page.getByRole('status').filter({ hasText: formularios.versionNueva });
      await expect(aviso).toHaveCount(0);

      const { rutas } = await contenidoDeLasCaches(page);
      const archivo = rutas.find((r) => r.startsWith('/_next/static/') && r.endsWith('.js'));
      if (archivo === undefined) throw new Error('el precache no tiene ningún .js');

      intermedio.publicarVersion2();
      intermedio.quitar(archivo);
      await page.evaluate(async () => {
        const registro = await navigator.serviceWorker.getRegistration();
        await registro?.update();
      });
      await expect(aviso).toBeVisible();

      // V5-33b: el servidor ya no lo tiene (404), pero el precache de la versión 1 lo sigue sirviendo.
      const estado = await page.evaluate(async (ruta) => (await fetch(ruta)).status, archivo);
      expect(estado).toBe(200);

      const antes = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
      await page.getByRole('button', { name: formularios.recargar }).click();
      await expect(aviso).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(async () => {
            const registro = await navigator.serviceWorker.getRegistration();
            return registro?.waiting ?? null;
          }),
        )
        .toBeNull();
      expect(antes).toContain('/serwist/sw.js');
    } finally {
      await intermedio.cerrar().catch(() => undefined);
    }
  });
});
