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

/**
 * [CH-279] Una selección v3 dentro de un grupo (C-45, CAMPOS-V3 §6): con 3 opciones o menos es un segmentado en su fila; con más,
 * una lista propia que abre su disparador. Elige por el nombre de la opción, después de que React hidrató el control.
 */
export async function elegirEnFila(page: Page, etiqueta: string, nombre: string): Promise<void> {
  const segmentado = page.getByRole('radiogroup', { name: etiqueta, exact: true });
  const enLista = (await segmentado.count()) === 0;
  const control = enLista
    ? page
        .locator('button[aria-haspopup="listbox"]')
        .and(page.getByRole('button', { name: new RegExp(`^${etiqueta}`) }))
    : segmentado.getByRole('radio', { name: nombre, exact: true });
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.click();
  if (enLista) await page.getByRole('option', { name: new RegExp(`^${nombre}`) }).click();
}
