// FT-67 Hallazgos accionables (06 FT-67; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de A.7 con el reloj del servidor
// fijo en el 15/10/2026 (DP-04) y abre `/reportes/hallazgos` como la persona. Los números los pone el motor: la prueba solo comprueba
// que la pantalla los dibuja y que la propuesta de un toque se ejecuta y se revierte (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const HOY_A7 = '2026-10-15';

/** A.7 después del paso 3 de 4.2 con el reloj del servidor en el 15/10/2026 (las E2E no importan valores del dominio). */
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
const fila = (page: Page, categoria: string) =>
  page.locator('[data-hallazgo-fila]').filter({ hasText: categoria });

test.describe('PRU-E2E-REP hallazgos accionables', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-234 [FT-67, CA-67.2] con A.7 Restaurantes aparece una sola vez, con el hallazgo de ritmo y su acción de un toque', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/hallazgos');
    await expect(page.locator('[data-hallazgo-fila]').first()).toBeVisible();
    expect(await page.locator('[data-hallazgo-fila]').count()).toBeLessThanOrEqual(5);
    const h = fila(page, 'Restaurantes');
    await expect(h).toHaveCount(1);
    await expect(h).toContainText(ti.hallazgo.ya('$26.30', 'Restaurantes', '$55.56', '20/10'));
    await expect(
      h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-sin-hallazgos]')).toHaveCount(0);
  });

  test('PRU-E2E-REP-235 [FT-67, CA-67.3] al ejecutar la propuesta queda «Deshacer»; al tocarla vuelve Asignado a $120.00 y el hallazgo reaparece', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/hallazgos');
    const h = fila(page, 'Restaurantes');
    const id =
      (await h.locator('[data-hallazgo]').getAttribute('data-hallazgo'))?.replace(
        'categoria:',
        '',
      ) ?? '';
    await h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }).click();
    const salida = page.locator('[data-ritmo-asignado]');
    await expect(salida).toContainText(t.ritmo.asignado('$55.56', 'Restaurantes'));
    await expect(h.locator('[data-hallazgo]')).toBeHidden();
    await salida.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(salida).toHaveCount(0);
    await expect(fila(page, 'Restaurantes').locator('[data-hallazgo]')).toBeVisible();
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      12000,
    );
  });
});
