// FT-03 Conectar MacroDroid (06 §2.2; 05 §2.11; 07 §17: una pantalla, un flujo y lo que guardan el navegador y su service worker).
// Cada prueba parte de una base vacía con el reloj del servidor fijo (DP-04) y recorre `/ajustes/webhook` como la persona. Los
// textos salen del catálogo (FE-51). Las respuestas de `/api/sms` y la Bandeja las prueban `token-webhook.rh.test.ts` (RH) y FT-34.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
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

const generar = (page: Page) => page.getByRole('button', { name: t.generar, exact: true });
/** «Saltar al contenido» solo se ve con foco (11.2): se mide ya visible, como PRU-E2E-PWA-007. */
const saltarConFoco = (page: Page) => page.getByRole('link', { name: navegacion.saltar }).focus();
const token = (page: Page) => page.getByTestId('token');

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
    await generar(page).click();

    await expect(token(page)).toHaveText(TOKEN);
    await expect(page.getByText(t.copiaAhora)).toBeVisible();
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
    await expect(page.getByRole('button', { name: t.cambiar, exact: true })).toBeVisible();
  });

  test('PRU-E2E-BAND-102 con un token, "Cambiar token" advierte antes y el nuevo reemplaza al anterior', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await generar(page).click();
    const primero = (await token(page).textContent()) ?? '';
    await abrir(page);

    await page.getByRole('button', { name: t.cambiar, exact: true }).click();
    await expect(page.getByText(t.advertenciaCambio)).toBeVisible();
    await page.getByRole('button', { name: t.confirmarCambio }).click();
    await expect(token(page)).toHaveText(TOKEN);
    expect(await token(page).textContent()).not.toBe(primero);
    await page.getByRole('button', { name: t.yaLoPegue }).click();
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
      await generar(page).click();
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
    await expect(generar(page)).toBeVisible();
    await saltarConFoco(page);
    await revisarTactil(page);
    await generar(page).click();
    await expect(token(page)).toHaveText(TOKEN);
    await saltarConFoco(page);
    await revisarTactil(page);
  });
});
