// Flujo corto en ruta interceptada (05 §1.4, FE-04). Usa las rutas de prueba de `(finn)/pruebas/` (solo con
// FINN_ENTORNO=pruebas) porque aún no hay un flujo corto real; el `webServer` ya fija esa variable.
import { expect, test } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';

const ORIGEN = '/pruebas/origen';
const FLUJO = '/pruebas/flujo-corto';

test.describe('PRU-E2E-PRES', () => {
  test('PRU-E2E-PRES-001 [V5-06] un flujo corto abre interceptado sobre su pantalla de origen y, recargando, como página completa', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto(ORIGEN);
    // El enrutador del cliente existe cuando la página se hidrató: antes, `push` sería una navegación completa.
    await page.waitForFunction(() => 'next' in window && 'router' in (window.next as object));
    await page.evaluate(() => {
      (window as unknown as { marca?: string }).marca = 'sin-recargar';
    });
    const abrir = (): Promise<void> =>
      page.evaluate((ruta) => {
        (window as unknown as { next: { router: { push(r: string): void } } }).next.router.push(
          ruta,
        );
      }, FLUJO);

    // V5-06a: desde otra pantalla (navegación de la app), se superpone y el origen sigue montado.
    await abrir();
    const dialogo = page.getByRole('dialog', { name: 'Flujo corto de prueba' });
    await expect(dialogo).toBeVisible();
    await expect(page).toHaveURL(FLUJO);
    await expect(page.locator('h1', { hasText: 'Origen de prueba' })).toBeAttached();
    expect(await page.evaluate(() => (window as unknown as { marca?: string }).marca)).toBe(
      'sin-recargar',
    );

    // V5-06b: cerrar vuelve al origen sin recargarlo.
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(page).toHaveURL(ORIGEN);
    expect(await page.evaluate(() => (window as unknown as { marca?: string }).marca)).toBe(
      'sin-recargar',
    );

    // V5-06c: recargar la URL del flujo lo muestra como página completa.
    await abrir();
    await expect(dialogo).toBeVisible();
    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Flujo corto de prueba' }),
    ).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { marca?: string }).marca)).toBe(
      undefined,
    );

    // V5-06d: la página completa se cierra a su ruta padre.
    await page.waitForFunction(() =>
      Object.keys(document.querySelector('main button') ?? {}).some((k) =>
        k.startsWith('__reactProps'),
      ),
    );
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page).toHaveURL(ORIGEN);
  });
});
