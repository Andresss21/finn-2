// FT-03 Conectar MacroDroid (06 §2.2; 05 §2.11; 07 §17: una pantalla, un flujo y lo que guardan el navegador y su service worker).
// Cada prueba parte de una base vacía con el reloj del servidor fijo (DP-04) y recorre `/ajustes/webhook` como la persona. Los
// textos salen del catálogo (FE-51). Las respuestas de `/api/sms` y la Bandeja las prueban `token-webhook.rh.test.ts` (RH) y FT-34.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { generarTokenWebhook } from '../../ayudas/webhook.ts';
import { visitarControlada } from '../../sw/ayudas-sw.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook as t } from '../../../src/textos/ajustes-webhook.ts';
import { navegacion } from '../../../src/textos/navegacion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/ajustes/webhook';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

async function preparar(hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND',
    titulo: 'Semilla de FT-03',
    refs: [],
    hoy,
    estadoInicial: [],
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page): Promise<void> {
  await page.goto(RUTA);
  await esperarHidratacion(page);
}

/** «Saltar al contenido» solo se ve con foco (11.2): se mide ya visible, como PRU-E2E-PWA-007. */
const saltarConFoco = (page: Page) => page.getByRole('link', { name: navegacion.saltar }).focus();
const token = (page: Page) => page.getByTestId('token');
const generarEnlace = (page: Page) => page.getByRole('link', { name: t.generar, exact: true });
const hoja = (page: Page) => page.getByRole('dialog');

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-101 [CA-03.1] genero el token y lo veo con "Copiar"; al cerrar el flujo y volver a abrirlo ya no se ve y la pantalla dice cuándo se generó', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await expect(page.getByText(t.sinToken)).toBeVisible();
    await generarTokenWebhook(page);

    await expect(token(page)).toHaveText(TOKEN);
    await expect(page.getByText(t.hoja.copialoAhora)).toBeVisible();
    await expect(page.getByTestId('url')).toHaveText(/\/api\/sms$/);
    await expect(
      page.getByRole('button', { name: `${t.copiar}: ${t.tokenEtiqueta}` }),
    ).toBeVisible();
    const visto = (await token(page).textContent()) ?? '';

    await abrir(page);
    // La fecha la pone la base al rotar (instante técnico, sin el reloj de prueba): se comprueba su forma
    await expect(
      page.getByText(/Token generado el \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}\./),
    ).toBeVisible();
    await expect(token(page)).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(visto);
    await expect(page.getByRole('link', { name: t.generarNuevo, exact: true })).toBeVisible();
  });

  test('PRU-E2E-BAND-102 con un token, "Generar un token nuevo" advierte antes y el nuevo reemplaza al anterior', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await generarTokenWebhook(page);
    const primero = (await token(page).textContent()) ?? '';
    await abrir(page);

    await page.getByRole('link', { name: t.generarNuevo, exact: true }).click();
    await expect(page.getByText(t.hoja.advertenciaTitulo)).toBeVisible();
    await page.getByRole('button', { name: t.generarNuevo, exact: true }).click();
    await expect(token(page)).toHaveText(TOKEN);
    expect(await token(page).textContent()).not.toBe(primero);
    await page.getByRole('button', { name: t.hoja.listo, exact: true }).click();
    await expect(token(page)).toHaveCount(0);
  });

  test.describe('con el service worker', () => {
    test.use({ serviceWorkers: 'allow' });
    test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

    test('PRU-E2E-BAND-103 [CA-03.4] con el token visible, ni sessionStorage, ni localStorage, ni la URL, ni la caché del service worker lo contienen', async ({
      page,
    }) => {
      await preparar('2027-02-05');
      await visitarControlada(page, RUTA);
      await esperarHidratacion(page);
      await generarTokenWebhook(page);
      await expect(token(page)).toHaveText(TOKEN);
      const visto = (await token(page).textContent()) ?? '';

      const guardado = await page.evaluate(async () => {
        const almacenes = JSON.stringify([
          Object.entries(sessionStorage),
          Object.entries(localStorage),
        ]);
        const cache: string[] = [];
        for (const nombre of await caches.keys()) {
          const c = await caches.open(nombre);
          for (const p of await c.keys()) {
            cache.push(p.url, (await (await c.match(p))?.clone().text()) ?? '');
          }
        }
        return { almacenes, cache: cache.join('\n') };
      });
      expect(guardado.almacenes).not.toContain(visto);
      expect(guardado.cache).not.toContain(visto);
      expect(page.url()).not.toContain(visto);
    });
  });

  test('PRU-E2E-BAND-104 todo control de la pantalla mide al menos 44 px, con el contenido ya cargado y con el token a la vista', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await expect(generarEnlace(page)).toBeVisible();
    await saltarConFoco(page);
    await revisarTactil(page);
    await generarTokenWebhook(page);
    await expect(token(page)).toHaveText(TOKEN);
    await saltarConFoco(page);
    await revisarTactil(page);
  });
  test('PRU-E2E-AJUS-701 [CA-E5-17b] en 390 px Conectar los SMS, Formatos e Instituciones tienen «←», campana y barra inferior, y Conectar los SMS no muestra ningún sufijo del token', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(page);
    await generarTokenWebhook(page);
    const generado = ((await token(page).textContent()) ?? '').trim();
    expect(generado).toMatch(TOKEN);

    for (const ruta of ['/ajustes/webhook', '/ajustes/formatos', '/ajustes/instituciones']) {
      await page.goto(ruta);
      await esperarHidratacion(page);
      const barra = page.locator('header[data-marco-barra]');
      await expect(
        barra.getByRole('link', { name: navegacion.volverA(navegacion.secciones.ajustes) }),
      ).toBeVisible();
      await expect(barra.getByRole('link', { name: /^Notificaciones/ })).toBeVisible();
      await expect(page.locator('nav[data-marco-barra]')).toBeVisible();
    }

    await page.goto(RUTA);
    await esperarHidratacion(page);
    await expect(page.getByText(t.noGuardado)).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${t.copiar}`) })).toHaveCount(0);
    for (const sufijo of [generado.slice(-4), generado.slice(-6), generado.slice(-8)])
      await expect(page.locator('body')).not.toContainText(sufijo);
  });

  test('PRU-E2E-AJUS-702 [CA-E5-21] «Generar un token nuevo» abre la hoja de /ajustes/webhook/token, confirma con el botón de peligro y muestra el token una sola vez; al volver, ya no está', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await generarTokenWebhook(page);
    await abrir(page);

    await page.getByRole('link', { name: t.generarNuevo, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/webhook\/token$/);
    await expect(hoja(page).getByText(t.hoja.advertenciaTitulo)).toBeVisible();
    const peligro = hoja(page).getByRole('button', { name: t.generarNuevo, exact: true });
    expect(await peligro.getAttribute('class')).toContain('bg-peligro');
    await peligro.click();

    await expect(token(page)).toHaveText(TOKEN);
    await expect(token(page)).toHaveCount(1);
    await expect(page.getByText(t.hoja.listoNuevo)).toBeVisible();
    await expect(
      page.getByRole('button', { name: `${t.copiar}: ${t.tokenEtiqueta}` }),
    ).toBeVisible();
    const visto = (await token(page).textContent()) ?? '';

    await page.getByRole('button', { name: t.hoja.listo, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/webhook$/);
    await expect(hoja(page)).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(visto);
    await abrir(page);
    await expect(page.locator('body')).not.toContainText(visto);
  });
});
