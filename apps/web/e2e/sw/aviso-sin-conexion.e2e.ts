// PRU-E2E-PWA-741 y PRU-E2E-PWA-742 (TA-565; E6-3, E6-4, D-10, CA-E4-3, CA-E4-23; 05 §8.5): el aviso de «sin conexión» del marco,
// el motivo de cada envío deshabilitado y la página `/sin-conexion` con un borrador en la pestaña.
// Usa el `test` de Playwright a secas, como PRU-SW-PWA-002: el bloqueo de red de la semilla no deja ir al servidor intermedio.
import { expect, test } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { PREFIJO_BORRADOR } from '../../src/formularios/clave-borrador.ts';
import { formularios } from '../../src/textos/formularios.ts';
import { navegacion } from '../../src/textos/navegacion.ts';

test.describe('PRU-E2E-PWA', () => {
  test('PRU-E2E-PWA-741 [CA-E4-3, CA-E6-4] sin conexión, el aviso dice solo «Estás sin conexión»; un enlace interno no navega y el aviso dice «Estás sin conexión. No se puede abrir esta pantalla.»; «Guardar» está deshabilitado con su motivo enlazado', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/registrar/gasto');
    await esperarHidratacion(page);
    await context.setOffline(true);
    const aviso = page.locator('[data-sin-conexion]');
    await expect(aviso).toHaveText(navegacion.sinConexion);
    expect(await aviso.evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe('16px');
    expect((await aviso.boundingBox())?.height).toBe(48);

    // El pie del flujo: «Guardar» deshabilitado con su motivo escrito y enlazado, también a 1280 px de ventana.
    const guardar = page.locator('button[type="submit"]').first();
    await expect(guardar).toBeDisabled();
    const motivo = page.getByText(formularios.sinConexionMotivo);
    await expect(motivo).toBeVisible();
    const idMotivo = await motivo.getAttribute('id');
    expect(await guardar.getAttribute('aria-describedby')).toContain(idMotivo ?? 'sin-id');

    // Un enlace interno no navega y el aviso lo dice.
    await context.setOffline(false);
    await page.goto('/pruebas/navegacion');
    await esperarHidratacion(page);
    await context.setOffline(true);
    await page.getByRole('link', { name: 'Ir al destino de navegación' }).click();
    await expect(page).toHaveURL('/pruebas/navegacion');
    await expect(aviso).toHaveText(navegacion.sinConexionNavegacion);
  });

  test('PRU-E2E-PWA-742 [CA-E6-5, CA-E6-11] /sin-conexion con un borrador en la pestaña dice que sigue guardado, con el visto y sin montos ni enlaces', async ({
    page,
  }) => {
    await page.addInitScript((prefijo) => {
      window.sessionStorage.setItem(`${prefijo}prueba`, '{"total":"12.50"}');
    }, PREFIJO_BORRADOR);
    await page.goto('/sin-conexion');
    const frase = page.getByText(navegacion.sinConexionPagina.borrador);
    await expect(frase).toBeVisible();
    await expect(frase.locator('[data-icono="check"]')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('12.50');
    await expect(page.getByRole('link')).toHaveCount(0);
  });
});
