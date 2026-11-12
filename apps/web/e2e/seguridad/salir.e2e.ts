// «Salir» a la vista y sesión vencida (05 §9.6 y §7.5 [CH-242]; entrega 4, «Entrega 3 · Salir a la vista» y E2-5). Cada prueba
// entra con su propia sesión (`entrarAal2`): `salir()` cierra la de este contexto, no la compartida de `inicio-sesion.setup.ts`.
// En el teléfono «Salir» es la última fila de la hoja «Más secciones»; en computadora, el pie de la barra lateral.
import type { Page } from '@playwright/test';
import { expect, test } from '../configuracion/semilla.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { navegacion } from '../../src/textos/navegacion.ts';
import { salir as t } from '../../src/textos/salir.ts';

const BORRADOR_GASTO = 'finn:borrador:v1:/registrar/gasto:';
const BORRADOR_ECO = 'finn:borrador:v1:/pruebas/eco:';

const leer = (page: Page, clave: string): Promise<string | null> =>
  page.evaluate((k) => window.sessionStorage.getItem(k), clave);

async function tocarSalir(page: Page): Promise<void> {
  const hoja = page.getByRole('dialog', { name: navegacion.secundarias });
  const menu = page.getByRole('button', { name: navegacion.secundarias });
  if (!(await hoja.isVisible()) && (await menu.isVisible())) {
    await menu.click();
    await expect(hoja).toBeVisible();
  }
  const donde = (await hoja.isVisible()) ? hoja : page.locator('aside [data-pieza="pie-salir"]');
  await donde.getByRole('button', { name: t.salir, exact: true }).click();
}

test.describe('PRU-E2E-ACCESO', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-ACCESO-731 [] CH-242: sin borradores, «Salir» lleva a /ingresar sin preguntar', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarHidratacion(page);
    const dialogos: string[] = [];
    await page.exposeFunction('anotarDialogo', (nombre: string) => {
      dialogos.push(nombre);
    });
    // Cualquier diálogo «cambios sin enviar» que se abra queda anotado antes de la navegación.
    await page.evaluate(() => {
      new MutationObserver(() => {
        for (const d of document.querySelectorAll('[role=dialog]')) {
          const nombre = d.getAttribute('aria-labelledby');
          const titulo =
            nombre === null ? '' : (document.getElementById(nombre)?.textContent ?? '');
          if (/sin enviar/.test(titulo))
            (window as unknown as { anotarDialogo: (n: string) => void }).anotarDialogo(titulo);
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    await tocarSalir(page);
    await page.waitForURL((u) => u.pathname === '/ingresar');
    expect(new URL(page.url()).search).toBe('');
    expect(dialogos).toEqual([]);
    // La sesión quedó cerrada: volver a Inicio pide ingresar.
    await page.goto('/');
    await page.waitForURL((u) => u.pathname === '/ingresar');
  });

  test('PRU-E2E-ACCESO-732 [] CH-242: con un borrador de Registrar gasto, «Salir» muestra «Tenés 1 cambio sin enviar»; «Quedarme» lo cierra y «Salir y borrarlo» sale y borra el borrador', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarHidratacion(page);
    await page.evaluate((clave) => {
      window.sessionStorage.setItem(
        clave,
        JSON.stringify({
          version: 1,
          guardadoEn: '2026-11-12T18:41:00.000Z',
          campos: { comercio: 'PriceSmart' },
          id: null,
          revisionAlAbrir: null,
        }),
      );
    }, BORRADOR_GASTO);

    await tocarSalir(page);
    const cambios = page.getByRole('dialog', { name: t.cambiosSinEnviar(1) });
    await expect(cambios).toBeVisible();
    expect(t.cambiosSinEnviar(1)).toBe('Tenés 1 cambio sin enviar');
    await expect(cambios.getByText(t.explicacion(1))).toBeVisible();
    await expect(cambios.getByText(t.flujos.gasto, { exact: true })).toBeVisible();
    await expect(cambios.getByText('PRICESMART · guardado 12:41')).toBeVisible();
    await expect(cambios.getByRole('link', { name: t.seguir })).toHaveAttribute(
      'href',
      '/registrar/gasto',
    );

    // «Quedarme» cierra el diálogo sin salir ni borrar.
    await cambios.getByRole('button', { name: t.quedarme }).click();
    await expect(cambios).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/');
    expect(await leer(page, BORRADOR_GASTO)).not.toBeNull();

    // «Salir y borrarlo» (singular, en `--peligro`) sale y borra el borrador de la pestaña.
    await tocarSalir(page);
    await expect(cambios).toBeVisible();
    await cambios.getByRole('button', { name: t.salirYBorrar(1) }).click();
    await page.waitForURL((u) => u.pathname === '/ingresar');
    expect(await leer(page, BORRADOR_GASTO)).toBeNull();
  });

  test('PRU-E2E-ACCESO-733 [CA-E2-3] con la sesión vencida durante un envío, Ingresar muestra «Tu sesión venció» y, con borrador en volver, la frase del borrador; sin borrador, no', async ({
    page,
    context,
  }) => {
    await page.goto('/pruebas/eco');
    await esperarHidratacion(page);
    await page.getByLabel('Texto').fill('a medio escribir');
    // FE-14: el borrador se escribe 500 ms después del último cambio.
    await expect.poll(() => leer(page, BORRADOR_ECO)).toContain('a medio escribir');

    // La sesión vence entre que se abrió el formulario y el envío: la Server Action responde NO_AUTORIZADO (05 §7.5).
    await context.clearCookies();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await page.waitForURL((u) => u.pathname === '/ingresar');
    const url = new URL(page.url());
    expect(url.searchParams.get('volver')).toBe('/pruebas/eco');
    expect(url.searchParams.get('motivo')).toBe('sesion-vencida');
    await esperarHidratacion(page);
    await expect(page.getByText(t.sesionVencida, { exact: true })).toBeVisible();
    await expect(page.getByText(`${t.sesionVencidaTexto} ${t.borradorGuardado}`)).toBeVisible();
    expect(await leer(page, BORRADOR_ECO)).toContain('a medio escribir');

    // Sin borrador para la ruta de `volver`: solo que la sesión venció.
    await page.goto('/ingresar?volver=%2Fpresupuesto&motivo=sesion-vencida');
    await esperarHidratacion(page);
    await expect(page.getByText(t.sesionVencida, { exact: true })).toBeVisible();
    await expect(page.getByText(t.sesionVencidaTexto, { exact: true })).toBeVisible();
    await expect(page.getByText(t.borradorGuardado)).toHaveCount(0);

    // Sin el motivo explícito no se deduce de `volver` (E2-5): un enlace de una notificación también lo trae.
    await page.goto('/ingresar?volver=%2Fpruebas%2Feco');
    await esperarHidratacion(page);
    await expect(page.getByText(t.sesionVencida, { exact: true })).toHaveCount(0);
  });
});
