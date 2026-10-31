// PRU-E2E-PWA-005 y PRU-E2E-PWA-009 (TA-212; 05 §3.3, §7.1 FE-39, §11.2): señal de navegación pendiente y foco al
// navegar. Usan las rutas de prueba de `(finn)/pruebas/navegacion` (solo con FINN_ENTORNO=pruebas) porque aún no hay
// pantallas reales; el enlace a la segunda no se precarga, que es el caso de D-8 (sin prefetch no hay `loading.tsx`).
import { entrarAal2 } from './ayudas/sesion.ts';
import { esperarHidratacion } from './ayudas/esperas.ts';
import { expect, test } from './configuracion/semilla.ts';
import { navegacion } from '../src/textos/index.ts';

const ORIGEN = '/pruebas/navegacion';
const DESTINO = '/pruebas/navegacion/destino';
const ENLACE_AL_DESTINO = 'Ir al destino de navegación';
const TITULO_DESTINO = 'Destino de navegación · Finn';

test.describe('PRU-E2E-PWA', () => {
  test('PRU-E2E-PWA-005 [V5-21] useLinkStatus marca aria-busy en el enlace y el marco muestra el indicador mientras la navegación está pendiente', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto(ORIGEN);
    await esperarHidratacion(page);

    // La respuesta RSC del destino queda retenida hasta que la prueba la libere (07 §14.5): nunca un tiempo fijo.
    let liberar: () => void = () => undefined;
    const compuerta = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    await page.route(
      (url) => url.pathname === DESTINO,
      async (ruta) => {
        if (ruta.request().headers()['rsc'] === '1') await compuerta;
        await ruta.continue();
      },
    );

    const enlace = page.getByRole('link', { name: ENLACE_AL_DESTINO });
    const indicador = page.getByRole('progressbar', { name: navegacion.navegando });
    await expect(enlace).not.toHaveAttribute('aria-busy', 'true');
    await expect(indicador).toHaveCount(0);

    await enlace.click();
    await expect(enlace).toHaveAttribute('aria-busy', 'true');
    await expect(indicador).toBeVisible();
    await expect(page).toHaveURL(ORIGEN);

    liberar();
    await expect(page).toHaveURL(DESTINO);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Destino de navegación' }),
    ).toBeVisible();
    await expect(indicador).toHaveCount(0);
  });

  test('PRU-E2E-PWA-009 [V5-28] tras navegar con un enlace el foco queda en body, el marco no lo mueve y el anunciador de rutas nombra la pantalla', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto(ORIGEN);
    await esperarHidratacion(page);

    // El marco publica el Encabezado de la página (FE-06) y el contador va en el nombre accesible del enlace (3.3).
    await expect(page.locator('html')).toHaveAttribute('data-revision', 'revision-de-prueba');
    await expect(
      page.getByRole('link', { name: navegacion.bandeja(3), exact: true }),
    ).toBeVisible();
    // En computadora hay dos accesos a Notificaciones (la campana y la barra lateral): los dos llevan el contador (N7).
    await expect(
      page.getByRole('link', { name: navegacion.notificaciones(2), exact: true }).first(),
    ).toBeVisible();

    const enlace = page.getByRole('link', { name: ENLACE_AL_DESTINO });
    await enlace.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(DESTINO);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Destino de navegación' }),
    ).toBeVisible();

    await expect(page).toHaveTitle(TITULO_DESTINO);
    // Next lee `document.title` y, si todavía está vacío al cambiar la ruta (los metadatos llegan por streaming), el
    // `h1`: las dos formas nombran la pantalla de destino (05 §11.2 solo describe la primera).
    await expect(page.locator('next-route-announcer')).toHaveText(
      /^Destino de navegación( · Finn)?$/,
    );
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  });
});
