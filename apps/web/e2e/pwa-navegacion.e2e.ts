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

  test('PRU-E2E-PWA-009 [V5-28] tras navegar con un enlace «Saltar al contenido» es alcanzable con Tab, el foco al navegar queda en body y el anunciador de rutas nombra la pantalla', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto(ORIGEN);
    await esperarHidratacion(page);

    // El marco publica el Encabezado de la página (FE-06) y el contador va en el nombre accesible del enlace (3.3, N7).
    await expect(page.locator('html')).toHaveAttribute('data-revision', 'revision-de-prueba');
    // La campana lleva el contador en su nombre (N7) y enlaza a `/notificaciones` (FT-69).
    await expect(
      page
        .locator('[data-marco-barra]')
        .getByRole('link', { name: navegacion.notificaciones(2), exact: true }),
    ).toBeVisible();

    // Al cargar la página, el primer Tab llega a «Saltar al contenido» (11.1) y activarlo enfoca el contenido.
    await page.keyboard.press('Tab');
    const saltar = page.getByRole('link', { name: navegacion.saltar });
    await expect(saltar).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#contenido')).toBeFocused();

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

  // TA-564 (E6-2, `T2-navegacion/en-curso`): el punto del enlace y la franja de 3 px mientras la navegación está pendiente.
  test('PRU-E2E-PWA-731 [CA-E6-2] al tocar Cuentas con la respuesta demorada, la franja de 3 px y el punto aparecen y se van al llegar', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/presupuesto');
    await esperarHidratacion(page);
    let liberar: () => void = () => undefined;
    const compuerta = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    await page.route(
      (url) => url.pathname === '/cuentas',
      async (ruta) => {
        const cabeceras = ruta.request().headers();
        if (cabeceras['rsc'] === '1' && cabeceras['next-router-prefetch'] === undefined)
          await compuerta;
        await ruta.continue();
      },
    );
    const enlace = page
      .locator('nav[aria-label="' + navegacion.principal + '"]:visible')
      .getByRole('link', { name: navegacion.secciones.cuentas });
    await enlace.click();
    await expect(enlace).toHaveAttribute('aria-busy', 'true');
    await expect(enlace.locator('[data-punto-pendiente]')).toBeVisible();
    const franja = page.getByRole('progressbar', { name: navegacion.navegando });
    await expect(franja).toBeVisible();
    expect((await franja.boundingBox())?.height).toBe(3);
    liberar();
    await expect(page).toHaveURL(/\/cuentas$/);
    await expect(franja).toHaveCount(0);
    await expect(page.locator('[data-punto-pendiente]')).toHaveCount(0);
  });
});
