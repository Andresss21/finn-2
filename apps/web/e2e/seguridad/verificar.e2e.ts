// PRU-E2E-ACCESO-721 (CA-E2-2; 05 §9.4 y FE-38 [CH-241]): el código del usuario de prueba en las seis casillas de
// /ingresar/verificar, sin envío automático. Parte sin cookies y recorre las dos pantallas de acceso como la persona.
import { expect, test } from '../configuracion/semilla.ts';
import { casillasDelCodigo, escribirCodigo } from '../ayudas/codigo.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { codigoTotp } from '../ayudas/totp.ts';
import { ingreso as t } from '../../src/textos/ingreso.ts';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: lo fija pnpm test:e2e`);
  return v;
};

test.describe('PRU-E2E-ACCESO', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('PRU-E2E-ACCESO-721 [CA-E2-2] ingresar escribiendo el código en las 6 casillas y Enter llega a Inicio', async ({
    page,
  }) => {
    await page.goto('/ingresar');
    await esperarHidratacion(page);
    await page.getByLabel(t.email).fill(variable('E2E_EMAIL'));
    await page.getByLabel(t.contrasena, { exact: true }).fill(variable('E2E_CLAVE'));
    await page.getByRole('button', { name: t.ingresar }).click();
    await page.waitForURL('**/ingresar/verificar**');
    await esperarHidratacion(page);

    let envios = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST') envios += 1;
    });
    const codigo = codigoTotp();
    await escribirCodigo(page, codigo);
    const casillas = casillasDelCodigo(page);
    await expect(casillas).toHaveCount(6);
    for (let i = 0; i < codigo.length; i += 1)
      await expect(casillas.nth(i)).toHaveValue(codigo.charAt(i));
    await expect(casillas.nth(5)).toBeFocused();
    // Con los seis escritos, nada se envió: sigue en Verificar y sin ningún POST.
    await expect(page.getByRole('button', { name: t.verificar })).toBeEnabled();
    expect(new URL(page.url()).pathname).toBe('/ingresar/verificar');
    expect(envios).toBe(0);

    await page.keyboard.press('Enter');
    await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'));
    expect(new URL(page.url()).pathname).toBe('/');
  });
});
