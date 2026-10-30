// Sesión AAL2 reutilizable (05 §14.1, FE-50): ingresa una vez por la interfaz y guarda el `storageState`.
// /ingresar y /ingresar/verificar los crean sus tareas dueñas (TA-214 y siguientes, DT-23): hasta entonces el proyecto
// `configuracion` no es dependencia de ninguno. Busca los campos por su `autocomplete` (05 §9.1) porque el catálogo de
// `src/textos/` todavía no tiene sus etiquetas; la dueña de la pantalla los pasa a `getByLabel` con el catálogo (FE-51).
import { test as preparar } from '@playwright/test';
import { codigoTotp } from '../ayudas/totp.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';

export const ARCHIVO_SESION = 'test-results/sesion.json';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: la crea tools/pruebas/e2e/usuario.ts al arrancar`);
  return v;
};

preparar('ingresa con contraseña y TOTP y guarda la sesión', async ({ page }) => {
  await page.goto('/ingresar');
  await esperarHidratacion(page);
  await page.locator('[autocomplete="username"]').fill(variable('E2E_EMAIL'));
  await page.locator('[autocomplete="current-password"]').fill(variable('E2E_CLAVE'));
  await page.keyboard.press('Enter');
  await page.waitForURL('**/ingresar/verificar**');
  await page.locator('[autocomplete="one-time-code"]').fill(codigoTotp());
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'));
  await page.context().storageState({ path: ARCHIVO_SESION });
});
