// Entrega 4, Seguridad: agregar un factor de respaldo con su nombre y quitarlo desde la hoja (CH-240 E2-7, E2-8; 05 §9.5, §9.6).
// El usuario de prueba termina con su factor de siempre: antes del grupo y después de cada prueba se quitan los respaldos.
import { expect, test } from '../configuracion/semilla.ts';
import { escribirCodigo } from '../ayudas/codigo.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { quitarRespaldos } from '../ayudas/factores.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { codigoDe } from '../ayudas/totp.ts';
import { ingreso as t } from '../../src/textos/ingreso.ts';
import { seguridad } from '../../src/textos/seguridad.ts';

test.describe('PRU-E2E-ACCESO', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(quitarRespaldos);
  test.afterEach(quitarRespaldos);

  test('PRU-E2E-ACCESO-711 [] agregar «Respaldo» con su nombre, verificar y volver a Seguridad con el resultado; quitarlo desde la hoja deja «Quitaste Respaldo.»', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/ajustes/seguridad/factores/nuevo');
    await esperarHidratacion(page);
    const nombre = page.getByLabel(t.nombreDelFactor);
    await expect(nombre).toHaveValue('Respaldo');
    await expect(page.getByText(t.nombreNoSeCambia)).toBeVisible();
    await page.getByRole('button', { name: t.seguir, exact: true }).click();
    await expect(page.getByAltText(t.altQr)).toBeVisible();
    await expect(nombre).toHaveAttribute('readonly', '');
    const secreto = (await page.getByTestId('secreto').innerText()).replace(/\s/g, '');
    await escribirCodigo(page, codigoDe(secreto));
    await page.getByRole('button', { name: t.verificar, exact: true }).click();
    await page.waitForURL((u) => u.pathname === '/ajustes/seguridad');
    await expect(page.getByText(seguridad.agregaste('Respaldo'))).toBeVisible();
    await expect(page.locator('[data-factor]')).toHaveCount(2);

    await page
      .locator('[data-factor]', { hasText: 'Respaldo' })
      .getByRole('link', { name: /^Quitar/ })
      .click();
    await expect(
      page.getByRole('dialog', { name: seguridad.preguntaQuitarFactor('Respaldo') }),
    ).toBeVisible();
    await page.getByRole('button', { name: seguridad.quitarNombre('Respaldo') }).click();
    await page.waitForURL(
      (u) => u.pathname === '/ajustes/seguridad' && u.searchParams.has('quitado'),
    );
    await expect(page.getByText(seguridad.quitaste('Respaldo'))).toBeVisible();
    await expect(page.locator('[data-factor]')).toHaveCount(1);
  });
});
