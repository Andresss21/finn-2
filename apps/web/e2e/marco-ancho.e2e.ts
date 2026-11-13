// PRU-E2E-PWA-801 (TA-597; C-32, CA-C32-2 a CA-C32-7 y CA-C32-9 del diseño): el Marco de computadora en pantallas anchas. A 1440, 1920, 2560 y 3440 px
// (alto 900) el bloque de 1144 px de contenido más 48 px de relleno se centra a la derecha de la barra lateral de 248 px, el título
// queda en su borde izquierdo, la campana en el derecho y el panel de notificaciones alinea su borde derecho con el de la campana.
import type { Page } from '@playwright/test';
import { entrarAal2 } from './ayudas/sesion.ts';
import { esperarContenido } from './ayudas/esperas.ts';
import { expect, sembrar, test } from './configuracion/semilla.ts';
import { alinearRelojes } from '../../../tools/pruebas/e2e/reloj.ts';

const HOY = '2026-10-15';
const RELLENO = 48;
const TOLERANCIA = 1;
const CAMPANA = 'header[data-marco-barra] a[href="/notificaciones"]';

// [ancho de ventana, borde izquierdo esperado, ancho esperado] del contenido
const CASOS = [
  [1440, 296, 1096],
  [1920, 512, 1144],
  [2560, 832, 1144],
  [3440, 1272, 1144],
] as const;
const RUTAS = ['/', '/presupuesto', '/cuentas', '/registrar/gasto'] as const;

async function caja(page: Page, selector: string) {
  const c = await page.locator(selector).first().boundingBox();
  if (c === null) throw new Error(`sin caja: ${selector}`);
  return c;
}

test.describe('PRU-E2E-PWA marco en pantallas anchas', () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-801 [CA-E4-5] a 1440, 1920, 2560 y 3440 px el contenido se centra a la derecha de la barra lateral, con el título en su borde izquierdo, la campana en el derecho, el panel de notificaciones alineado a la campana y sin desplazamiento horizontal', async ({
    page,
  }) => {
    await alinearRelojes(page, `${HOY}T12:41:00-06:00`);
    const { escenarioA7 } = await import('../../../packages/aplicacion/test/escenarios/a7.ts');
    await sembrar(escenarioA7(), HOY);
    for (const [ancho, izquierdo, esperado] of CASOS) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of RUTAS) {
        await page.goto(ruta);
        await esperarContenido(page);
        const main = await caja(page, '#contenido > main');
        const flujo = ruta === '/registrar/gasto';
        const izq = main.x + RELLENO;
        const nombre = `${String(ancho)} ${ruta}`;
        expect(Math.abs(izq - izquierdo), `${nombre} borde izquierdo`).toBeLessThanOrEqual(
          TOLERANCIA,
        );
        const h1 = await caja(page, '#contenido h1');
        expect(Math.abs(h1.x - izq), `${nombre} título`).toBeLessThanOrEqual(TOLERANCIA);
        // El flujo largo no lleva campana ni barra (E4-26) y su ancho depende del flujo
        if (!flujo) {
          expect(
            Math.abs(main.width - 2 * RELLENO - esperado),
            `${nombre} ancho`,
          ).toBeLessThanOrEqual(TOLERANCIA);
          const campana = await caja(page, CAMPANA);
          expect(
            Math.abs(campana.x + campana.width - (main.x + main.width - RELLENO)),
            `${nombre} campana`,
          ).toBeLessThanOrEqual(TOLERANCIA);
        }
        const desborda = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(desborda, `${nombre} desplazamiento horizontal`).toBe(false);
      }
      // El panel de notificaciones: su borde derecho es el de la campana
      await page.goto('/');
      await esperarContenido(page);
      const campana = await caja(page, CAMPANA);
      await page.locator(CAMPANA).click();
      const panel = page.getByRole('dialog');
      await expect(panel).toBeVisible();
      const p = await panel.boundingBox();
      expect(p).not.toBeNull();
      expect(
        Math.abs((p?.x ?? 0) + (p?.width ?? 0) - (campana.x + campana.width)),
        `${String(ancho)} panel de notificaciones`,
      ).toBeLessThanOrEqual(TOLERANCIA);
    }
  });
});
