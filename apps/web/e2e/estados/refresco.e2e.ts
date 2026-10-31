// PRU-E2E-RELOJ-002 (TA-220; 05 §6.7, V5-10; 07 §4.1): la pantalla abierta pasa al día siguiente a medianoche, sin
// recargar. El servidor y el navegador comparten el instante (DP-04); el servidor salta al día nuevo y el navegador
// avanza su reloj hasta el objetivo de la agenda (medianoche de El Salvador + 5 s).
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { expect, test } from '../configuracion/semilla.ts';
import { navegacion } from '../../src/textos/index.ts';
import {
  alinearRelojes,
  borrarRelojServidor,
  fijarRelojServidor,
} from '../../../../tools/pruebas/e2e/reloj.ts';

test.describe('PRU-E2E-RELOJ', () => {
  test.afterEach(() => {
    borrarRelojServidor();
  });

  test('PRU-E2E-RELOJ-002 [V5-10, FE-21, FE-35] la pantalla abierta pasa al día siguiente a medianoche sin recargar y avisa cuando no hay conexión', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await alinearRelojes(page, '2027-03-05T23:59:30-06:00');
    await page.goto('/pruebas/reloj');
    await esperarHidratacion(page);
    await expect(page.locator('html')).toHaveAttribute('data-hoy', '2027-03-05');
    await expect(page.getByText('Hoy es 2027-03-05')).toBeVisible();

    // Marca de la página: si hubiera recarga, desaparecería.
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>)['__sinRecarga'] = true;
    });

    // El servidor ya está en el día nuevo; faltan 35 s (30 s + 5 s de margen) para el objetivo de la agenda.
    fijarRelojServidor('2027-03-06T00:00:10-06:00');
    await page.clock.fastForward(36_000);

    await expect(page.locator('html')).toHaveAttribute('data-hoy', '2027-03-06');
    await expect(page.getByText('Hoy es 2027-03-06')).toBeVisible();
    const marca = await page.evaluate(
      () => (window as unknown as Record<string, unknown>)['__sinRecarga'],
    );
    expect(marca).toBe(true);

    // FE-35: sin conexión el aviso persiste y la pantalla sigue como estaba; al volver, el aviso desaparece y se refresca.
    const aviso = page.getByRole('status').filter({ hasText: navegacion.sinConexion });
    await context.setOffline(true);
    await expect(aviso).toBeVisible();
    await expect(page.getByText('Hoy es 2027-03-06')).toBeVisible();
    fijarRelojServidor('2027-03-06T12:00:00-06:00');
    await context.setOffline(false);
    await expect(aviso).toBeHidden();
  });
});
