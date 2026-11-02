// Ayudas de espera por estado (05 §14.4): nunca un tiempo fijo (07 §7.1). Los atributos son el contrato de 05 §14.3.
import { expect, type Page } from '@playwright/test';

/** `data-hidratado="si"` en `<html>`: lo pone el marco en su primer efecto. */
export async function esperarHidratacion(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-hidratado', 'si');
}

/**
 * El contenido de la ruta ya está en pantalla. El marco hidrata antes de que llegue una página que consulta datos: mientras se
 * transmite, `loading.tsx` ocupa su lugar y lo que React ya envió espera oculto, midiendo 0×0. El estado de carga (FE-33) lleva
 * `aria-busy`; cada frontera sin resolver deja `template#B:n` y su contenido en espera, `div[hidden]#S:n`. Ambos ya están en el
 * primer envío, así que no hay un momento en que falten y el contenido siga pendiente.
 */
export async function esperarContenido(page: Page): Promise<void> {
  await esperarHidratacion(page);
  await expect(
    page.locator('[aria-busy="true"], template[id^="B:"], div[hidden][id^="S:"]'),
  ).toHaveCount(0);
}

/** Espera a que `data-revision` cambie después de una escritura o de un refresco (6.3, 6.7). */
export async function esperarRevisionNueva(page: Page, anterior: string): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-revision', /.+/);
  await expect(page.locator('html')).not.toHaveAttribute('data-revision', anterior);
}
