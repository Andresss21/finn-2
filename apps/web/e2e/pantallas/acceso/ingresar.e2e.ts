// FT-01 Ingresar con contraseña y TOTP (06 §2.1; 05 §9; 07 §17: una pantalla, una navegación o un flujo). Cada prueba parte sin
// cookies y recorre /ingresar y /ingresar/verificar como la persona. Los campos se buscan por su etiqueta del catálogo (FE-51).
import { expect, test } from '../../configuracion/semilla.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { codigoTotp } from '../../ayudas/totp.ts';
import { autenticacion } from '../../../src/textos/autenticacion.ts';
import { ingreso as t } from '../../../src/textos/ingreso.ts';
import type { Page } from '@playwright/test';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: lo fija pnpm test:e2e`);
  return v;
};

const destinoDe = (url: string): string => {
  const { pathname, search } = new URL(url);
  return pathname + search;
};

async function completarContrasena(page: Page, email: string, clave: string): Promise<void> {
  await page.getByLabel(t.email).fill(email);
  await page.getByLabel(t.contrasena, { exact: true }).fill(clave);
  await page.getByRole('button', { name: t.ingresar }).click();
}

async function completarCodigo(page: Page): Promise<void> {
  await page.getByLabel(t.codigo).fill(codigoTotp());
  await page.getByRole('button', { name: t.verificar }).click();
}

test.describe('PRU-E2E-ACCESO', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('PRU-E2E-ACCESO-102 [CA-01.1] sin sesión llego a /ingresar con volver y, tras los dos pasos, a esa misma URL', async ({
    page,
  }) => {
    const destino = '/presupuesto?periodo=2026-09-21';
    await page.goto(destino);
    expect(destinoDe(page.url())).toBe('/ingresar?volver=%2Fpresupuesto%3Fperiodo%3D2026-09-21');
    await esperarHidratacion(page);
    await completarContrasena(page, variable('E2E_EMAIL'), variable('E2E_CLAVE'));
    await page.waitForURL('**/ingresar/verificar**');
    expect(destinoDe(page.url())).toBe(
      '/ingresar/verificar?volver=%2Fpresupuesto%3Fperiodo%3D2026-09-21',
    );
    await completarCodigo(page);
    await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'));
    expect(destinoDe(page.url())).toBe(destino);
  });

  test('PRU-E2E-ACCESO-103 [CA-01.2] un email inexistente, una contraseña incorrecta y otro usuario dan el mismo mensaje', async ({
    page,
  }) => {
    await page.goto('/ingresar');
    await esperarHidratacion(page);
    const casos: readonly (readonly [string, string])[] = [
      ['nadie-e2e@finn.test', variable('E2E_CLAVE')],
      [variable('E2E_EMAIL'), `${variable('E2E_CLAVE')}x`],
      [variable('E2E_OTRO_EMAIL'), variable('E2E_OTRO_CLAVE')],
    ];
    for (const [email, clave] of casos) {
      // Esperar la respuesta de ESTE envío: el mensaje del anterior sigue en pantalla mientras tanto
      const respuesta = page.waitForResponse((r) => r.request().method() === 'POST');
      await completarContrasena(page, email, clave);
      await respuesta;
      await expect(page.getByText(autenticacion.credenciales_invalidas)).toBeVisible();
      await expect(page).toHaveURL(/\/ingresar$/);
      await expect(page.getByText(autenticacion.credenciales_invalidas)).toHaveCount(1);
    }
  });

  test('PRU-E2E-ACCESO-104 [CA-01.5] un volver hacia otro sitio termina en /', async ({
    page,
    baseURL,
  }) => {
    for (const ajeno of ['https://otro.sitio', '//otro.sitio']) {
      await page.context().clearCookies();
      await page.goto(`/ingresar?volver=${encodeURIComponent(ajeno)}`);
      await esperarHidratacion(page);
      await completarContrasena(page, variable('E2E_EMAIL'), variable('E2E_CLAVE'));
      await page.waitForURL('**/ingresar/verificar**');
      await completarCodigo(page);
      await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'));
      expect(page.url()).toBe(`${baseURL}/`);
    }
  });

  test('PRU-E2E-ACCESO-105 [CA-01.6] con sesión AAL2, /ingresar y /ingresar/verificar redirigen a volver o a / sin mostrar el formulario', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/ingresar');
    expect(destinoDe(page.url())).toBe('/');
    await page.goto('/ingresar/verificar?volver=%2Fpruebas%2Forigen');
    expect(destinoDe(page.url())).toBe('/pruebas/origen');
    await expect(page.getByLabel(t.codigo)).toHaveCount(0);
  });
});
