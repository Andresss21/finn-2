// Generar el token del webhook (FT-03, OPT-01) como lo hace la persona: desde `/ajustes/webhook` se abre el flujo corto
// `/ajustes/webhook/token` (CH-E5-3) y se confirma. Sin token todavía, el enlace y el botón se llaman igual («Generar token»).
// Después queda a la vista `getByTestId('token')`, dentro de la hoja.
import type { Page } from '@playwright/test';
import { ajustesWebhook } from '../../src/textos/ajustes-webhook.ts';

export async function generarTokenWebhook(page: Page): Promise<void> {
  await page.getByRole('link', { name: ajustesWebhook.generar, exact: true }).click();
  await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
}
