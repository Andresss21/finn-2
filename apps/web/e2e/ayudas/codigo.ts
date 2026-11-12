// El código TOTP en seis casillas (05 §9.4 y §9.5 [CH-241]): se escribe como la persona, dígito a dígito desde la primera
// casilla; cada dígito avanza a la siguiente. El grupo se busca por su nombre del catálogo (FE-51).
import type { Page } from '@playwright/test';
import { ingreso } from '../../src/textos/ingreso.ts';

export const casillasDelCodigo = (page: Page) =>
  page.getByRole('group', { name: ingreso.codigo }).getByRole('textbox');

export async function escribirCodigo(page: Page, codigo: string): Promise<void> {
  await casillasDelCodigo(page).first().click();
  await page.keyboard.type(codigo);
}
