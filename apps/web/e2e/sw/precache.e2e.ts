// PRU-SW-PWA-001 y PRU-SW-PWA-003 (TA-223; 05 §8.1, §8.3): el service worker se sirve estático y sin mapa de fuentes,
// solo guarda archivos estáticos y `/sin-conexion` (nunca páginas ni respuestas RSC) y la app es instalable.
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { expect, test } from '../configuracion/semilla.ts';
import { contenidoDeLasCaches, visitarControlada } from './ayudas-sw.ts';

test.describe('PRU-SW-PWA', () => {
  test.use({ serviceWorkers: 'allow' });
  // WebKit en Playwright no tiene CDP ni un service worker comparable: el service worker se prueba en Chromium (07 §3.2).
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

  test('PRU-SW-PWA-001 [V5-29, FE-52, FE-53, FE-54] /serwist/sw.js se sirve con Service-Worker-Allowed, sin mapa, y tras recorrer pantallas con sesión la caché solo guarda /_next/static, /marca y /sin-conexion', async ({
    page,
    context,
    baseURL,
    request,
  }) => {
    const sw = await request.get('/serwist/sw.js', { maxRedirects: 0 });
    expect(sw.status()).toBe(200);
    expect(sw.headers()['service-worker-allowed']).toBe('/');
    expect(sw.headers()['content-type']).toContain('javascript');
    expect((await request.get('/serwist/sw.js.map', { maxRedirects: 0 })).status()).toBe(404);

    await visitarControlada(page, '/sin-conexion');
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/pruebas/navegacion');
    await esperarHidratacion(page);
    await page.getByRole('link', { name: 'Ir al destino de navegación' }).click();
    await expect(page).toHaveURL('/pruebas/navegacion/destino');
    await page.reload();
    await page.goto('/pruebas/navegacion');
    await esperarHidratacion(page);

    const { caches, rutas } = await contenidoDeLasCaches(page);
    expect(caches).toHaveLength(1);
    expect(rutas).toContain('/sin-conexion');
    expect(rutas.some((r) => r.startsWith('/_next/static/'))).toBe(true);
    expect(rutas.filter((r) => !/^\/(_next\/static\/|marca\/|sin-conexion$)/.test(r))).toEqual([]);
  });

  test('PRU-SW-PWA-003 [V5-31] con el manifiesto y el service worker Chromium no reporta errores de instalabilidad', async ({
    page,
    context,
  }) => {
    await visitarControlada(page, '/sin-conexion');
    const cdp = await context.newCDPSession(page);
    // En un contexto efímero el único error es `in-incognito`, propio del entorno de prueba (05 §8.2).
    await expect
      .poll(async () => {
        const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
          installabilityErrors: { errorId: string }[];
        };
        return installabilityErrors.map((e) => e.errorId).filter((id) => id !== 'in-incognito');
      })
      .toEqual([]);
  });
});
