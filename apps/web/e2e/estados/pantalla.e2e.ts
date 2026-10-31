// Estados de pantalla (TA-213; 05 §2.1, §2.2, §6.1, §7.1 a §7.3): `error.tsx` con el `digest`, `NO_ENCONTRADO` → 404,
// la señal de carga con `loading.tsx` y la caché del enrutador. Aún no hay pantallas reales: usan las rutas de prueba
// de `(finn)/pruebas/estados/[caso]` (solo con FINN_ENTORNO=pruebas), que llaman a `consultar()` con consultas simuladas.
import type { Page } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { expect, test } from '../configuracion/semilla.ts';
import { base, estados, navegacion } from '../../src/textos/index.ts';

const BASE = '/pruebas/estados';
// El anunciador de rutas de Next también tiene role=alert.
const alerta = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-002 [V5-15] un error de la consulta llega a error.tsx con el idError como referencia, sin su mensaje y con el marco visible', async ({
    page,
  }) => {
    await page.goto(`${BASE}/error`);
    await esperarHidratacion(page);

    await expect(alerta(page)).toContainText(estados.errorTitulo);
    // La referencia es el mismo `idError` de la consulta (a) y el mensaje original no llega al navegador (b).
    await expect(alerta(page)).toContainText(estados.referencia('E-PRU-213'));
    expect(await page.content()).not.toContain('mensaje-interno-de-la-consulta');
    // `error.tsx` de `(finn)` está por debajo del layout: el marco sigue visible.
    await expect(page.getByRole('link', { name: navegacion.saltar })).toBeAttached();
    await expect(page.getByRole('button', { name: base.reintentar })).toBeVisible();
  });

  test('PRU-E2E-PWA-002 [V5-15] un error sin idError llega con la referencia de Next y sin su texto', async ({
    page,
  }) => {
    await page.goto(`${BASE}/fallo`);
    await esperarHidratacion(page);

    await expect(alerta(page)).toContainText(/Referencia: \d+/);
    expect(await page.content()).not.toContain('fallo-de-programacion');
  });

  test('PRU-E2E-PWA-003 [V5-17] NO_ENCONTRADO y un segmento inválido muestran «Esto ya no existe.» con el enlace a la sección y noindex [CH-59]', async ({
    page,
  }) => {
    for (const caso of ['no-encontrado', 'segmento']) {
      // Con loading.tsx la respuesta sale en streaming y el estado HTTP ya es 200 (CH-59): lo que se exige es la pantalla.
      const respuesta = await page.goto(`${BASE}/${caso}`);
      expect([200, 404], caso).toContain(respuesta?.status());
      await expect(page.getByRole('heading', { name: estados.noExisteTitulo })).toBeVisible();
      await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
      // Fuera de una sección real el enlace lleva a Inicio.
      await expect(page.getByRole('main').getByRole('link', { name: /^Ir a / })).toHaveAttribute(
        'href',
        '/',
      );
    }
  });

  test('PRU-E2E-PWA-003 FE-27, FE-28: un parámetro inválido redirige a la misma ruta sin él y los demás se convierten; NO_AUTORIZADO lleva a ingresar con volver', async ({
    page,
  }) => {
    await page.goto(`${BASE}/parametros?periodo=zzz&filtro=sin-fondos&cuentas=a,b&archivadas=1`);
    // Con loading.tsx la respuesta ya salió: la redirección llega por el flujo, y se espera por el estado (07 §7.1).
    await expect(page).not.toHaveURL(/periodo=/);
    await esperarHidratacion(page);
    const url = new URL(page.url());
    expect(url.pathname).toBe(`${BASE}/parametros`);
    expect([...url.searchParams.keys()].sort()).toEqual(['archivadas', 'cuentas', 'filtro']);
    expect(JSON.parse((await page.locator('pre').textContent()) ?? '')).toEqual({
      filtro: 'sin_fondos',
      cuentaIds: ['a', 'b'],
      incluirArchivadas: true,
    });

    await page.goto(`${BASE}/sesion?x=1`);
    await expect(page).toHaveURL(/\/ingresar\/verificar/);
    const destino = new URL(page.url());
    expect(destino.pathname).toBe('/ingresar/verificar');
    expect(destino.searchParams.get('volver')).toBe(`${BASE}/sesion?x=1`);
  });

  test('PRU-E2E-PWA-003 FE-34: las clases de vacío primer uso y sin resultados llevan a su acción', async ({
    page,
  }) => {
    await page.goto(`${BASE}/vacios?texto=cafe&cuenta=x&otro=1`);
    await esperarHidratacion(page);
    await expect(page.getByRole('link', { name: estados.primerUso.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
    await expect(
      page.getByRole('link', { name: estados.primerUso.revisarCategorias }),
    ).toHaveAttribute('href', '/presupuesto/estructura');
    await expect(page.getByText(estados.sinResultados.titulo)).toBeVisible();
    await page.getByRole('link', { name: estados.sinResultados.quitar }).click();
    await expect(page).toHaveURL(`${BASE}/vacios?otro=1`);
  });

  test('PRU-E2E-PWA-004 [V5-19] el prefetch del enlace termina y al navegar a la página lenta aparece la señal de EnlaceFinn [CH-59]', async ({
    page,
  }) => {
    // El prefetch del enlace visible (producción) tiene que terminar antes de tocarlo (FE-39, V5-19).
    const prefetch = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `${BASE}/carga` &&
        r.request().headers()['next-router-segment-prefetch'] === '/_tree',
    );
    await page.goto(`${BASE}/origen`);
    await esperarHidratacion(page);
    // Lo que se mide (CH-59): el prefetch del enlace visible termina bien. Su respuesta trae el árbol del segmento y no
    // el contenido del loading.tsx, que llega con la respuesta de la navegación.
    expect((await prefetch).status()).toBe(200);

    let liberar: () => void = () => undefined;
    const compuerta = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    // Solo la navegación queda retenida (07 §14.5): el prefetch ya pasó.
    await page.route(
      (url) => url.pathname === `${BASE}/carga`,
      async (ruta) => {
        const cabeceras = ruta.request().headers();
        if (cabeceras['rsc'] === '1' && cabeceras['next-router-prefetch'] === undefined)
          await compuerta;
        await ruta.continue();
      },
    );

    // La señal garantizada al navegar es la de EnlaceFinn (FE-39); pintar el loading.tsx en navegación no se
    // reproduce con (finn), el slot y Marco (CH-59, limitación conocida).
    const enlace = page.getByRole('link', { name: 'Ir a la página lenta' });
    await enlace.click();
    await expect(enlace).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('progressbar', { name: navegacion.navegando })).toBeVisible();
    await expect(page).toHaveURL(`${BASE}/origen`);

    liberar();
    await expect(page.getByRole('heading', { level: 1, name: 'Página lenta' })).toBeVisible();
    await expect(enlace).toHaveCount(0);
  });

  test('PRU-E2E-PWA-006 [V5-22] atrás y adelante restauran la página de la caché del enrutador; un enlace a la misma página hace un render nuevo', async ({
    page,
  }) => {
    await page.goto(`${BASE}/cache`);
    await esperarHidratacion(page);
    const marca = page.getByTestId('render');
    const primera = await marca.textContent();

    await page.getByRole('link', { name: 'Ir a otra página' }).click();
    await expect(page).toHaveURL(`${BASE}/carga`);
    await page.goBack();
    await expect(page).toHaveURL(`${BASE}/cache`);
    await expect(marca).toHaveText(primera ?? '');

    await page.getByRole('link', { name: 'Esta misma página' }).click();
    await expect(marca).not.toHaveText(primera ?? '');
  });
});
