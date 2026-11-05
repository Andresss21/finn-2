// Las selecciones nativas del export (K2, S5; `base/seleccion-nativa.tsx`) se eligen por el nombre de la opción. Lo usan Registrar
// gasto y Revisar movimiento (CH-136).
import { expect, type Locator, type Page } from '@playwright/test';

/** El `<select>` con esa etiqueta accesible (la cuenta, el destino de una línea). */
export const seleccion = (page: Page, etiqueta: string): Locator =>
  page.getByLabel(etiqueta, { exact: true });

/** Elige una opción por su nombre, después de que React hidrató el control (un cambio anterior se perdería). */
export async function elegirOpcion(page: Page, etiqueta: string, nombre: string): Promise<void> {
  const control = seleccion(page, etiqueta);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
}
