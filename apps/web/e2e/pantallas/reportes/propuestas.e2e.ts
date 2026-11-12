// Entrega 4 (CH-240, TA-588): el resultado de una propuesta de Ritmo reemplaza al hallazgo, con «Deshacer», y la pantalla muestra lo que
// vuelve del servidor (CF-05, 05 §4.13 y §4.14; E6-15). 07 §17: una pantalla es una E2E. Los números los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const HOY_A7 = '2026-10-15';

async function sembrarA7(): Promise<void> {
  const { escenarioA7 } = await import('../../../../../packages/aplicacion/test/escenarios/a7.ts');
  const escenario = escenarioA7();
  fijarRelojServidor(`${HOY_A7}T10:00:00-06:00`);
  await sembrar(escenario, escenario.hoy ?? HOY_A7);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

test.describe('PRU-E2E-REP propuestas de los reportes', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-721 [CA-E6-17] «Asignar $55.56» de Ritmo deja el resultado con «Deshacer» y los datos revalidados; «Deshacer» devuelve el hallazgo RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const hallazgo = page.locator('[data-hallazgo]').filter({ hasText: 'Restaurantes' });
    const id = (await hallazgo.getAttribute('data-hallazgo'))?.replace('categoria:', '') ?? '';
    await hallazgo
      .getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true })
      .click();
    const resultado = page.locator('[data-ritmo-asignado]');
    await expect(resultado).toContainText(t.ritmo.asignado('$55.56', 'Restaurantes'));
    await expect(resultado.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();
    // Los datos ya vienen revalidados: Asignado en el servidor es el nuevo.
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      17556,
    );
    await abrir(page, '/reportes/ritmo');
    await expect(page.locator('[data-hallazgo]').filter({ hasText: 'Restaurantes' })).toHaveCount(
      0,
    );

    // La propuesta de otra sesión de la página: se asigna de nuevo, se deshace y el hallazgo reaparece.
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    await page
      .locator('[data-hallazgo]')
      .filter({ hasText: 'Restaurantes' })
      .getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true })
      .click();
    await page
      .locator('[data-ritmo-asignado]')
      .getByRole('button', { name: ti.deshacer, exact: true })
      .click();
    await expect(page.locator('[data-ritmo-asignado]')).toHaveCount(0);
    await expect(page.locator('[data-hallazgo]').filter({ hasText: 'Restaurantes' })).toHaveCount(
      1,
    );
  });
});
