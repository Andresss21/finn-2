// Sesión AAL2 reutilizable (05 §14.1, FE-50): ingresa una vez por la interfaz (FT-01) y guarda el `storageState`.
// Los campos se buscan por su etiqueta del catálogo (FE-51).
import { test as preparar } from '@playwright/test';
import { codigoTotp } from '../ayudas/totp.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { ingreso as t } from '../../src/textos/ingreso.ts';

export const ARCHIVO_SESION = 'test-results/sesion.json';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: la crea tools/pruebas/e2e/usuario.ts al arrancar`);
  return v;
};

preparar('ingresa con contraseña y TOTP y guarda la sesión', async ({ page }) => {
  await page.goto('/ingresar');
  await esperarHidratacion(page);
  await page.getByLabel(t.email).fill(variable('E2E_EMAIL'));
  await page.getByLabel(t.contrasena, { exact: true }).fill(variable('E2E_CLAVE'));
  await page.keyboard.press('Enter');
  await page.waitForURL('**/ingresar/verificar**');
  await page.getByLabel(t.codigo).fill(codigoTotp());
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'));
  await page.context().storageState({ path: ARCHIVO_SESION });
});
