// Ayudas de espera por estado (05 §14.4): nunca un tiempo fijo (07 §7.1). Los atributos son el contrato de 05 §14.3.
import { expect, type Page } from '@playwright/test';

/** `data-hidratado="si"` en `<html>`: lo pone el marco en su primer efecto. */
export async function esperarHidratacion(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-hidratado', 'si');
}

/** Espera a que `data-revision` cambie después de una escritura o de un refresco (6.3, 6.7). */
export async function esperarRevisionNueva(page: Page, anterior: string): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-revision', /.+/);
  await expect(page.locator('html')).not.toHaveAttribute('data-revision', anterior);
}
