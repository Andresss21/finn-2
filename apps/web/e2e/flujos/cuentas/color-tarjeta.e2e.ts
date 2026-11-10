// FT-50 Crear la tarjeta con su color (CH-225; 06-identidad-visual §2.9; 07 §17: un flujo es una E2E). La persona elige zafiro con la
// vista previa en vivo y crea la tarjeta; Cuentas y el detalle la dibujan zafiro (el color que guardó), en claro y en oscuro.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasNueva as t } from '../../../src/textos/cuentas-nueva.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const ZAFIRO = /rgb\(36, 80, 154\)/; // #24509A, el tono más claro del degradado zafiro (CH-225 c)
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

/** La cara del frente: su degradado sale del token, así que el computado trae el tono más claro del zafiro. */
async function caraZafiro(page: Page): Promise<void> {
  const cara = page.locator('[data-tarjeta][data-color="zafiro"]').first();
  await expect(cara).toBeVisible();
  await expect(cara).toHaveCSS('background-image', ZAFIRO);
}

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  for (const tema of ['light', 'dark'] as const) {
    test(`PRU-E2E-CTA-490 [FT-50, FT-51, FT-52] creo una tarjeta zafiro y la veo zafiro en Cuentas y en su detalle, en el tema ${tema}`, async ({
      page,
    }) => {
      const hoy = '2027-02-05';
      fijarRelojServidor(`${hoy}T10:00:00-06:00`);
      const escenario: Escenario = {
        id: 'SEM-CTA-COLOR',
        titulo: 'Semilla de CH-225',
        refs: [],
        hoy,
        estadoInicial: [],
        pasos: [],
      };
      await sembrar(escenario, hoy);
      await page.emulateMedia({ colorScheme: tema });

      await page.goto('/cuentas/nueva?tipo-cuenta=tarjeta');
      await esperarHidratacion(page);
      const vista = page.locator('[data-vista-previa] [data-tarjeta]');
      await expect(vista).toHaveAttribute('data-color', 'oro');
      await campo(page, t.nombre).fill('Visa Zafiro');
      await campo(page, t.saldo.tarjeta).fill('0');
      await campo(page, t.limiteCredito).fill('1500');
      await campo(page, t.diaCorte).fill('15');
      await campo(page, t.diaPago).fill('5');
      await page.locator('[data-color-tarjeta] label').filter({ hasText: 'Zafiro' }).click();
      await expect(vista).toHaveAttribute('data-color', 'zafiro');
      await page.getByRole('button', { name: t.guardar }).click();
      await expect(page).toHaveURL(/\/cuentas$/);
      await esperarContenido(page);

      await caraZafiro(page);
      await page.getByRole('link', { name: 'Ver detalle de Visa Zafiro', exact: true }).click();
      await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
      await esperarContenido(page);
      await caraZafiro(page);
    });
  }
});
