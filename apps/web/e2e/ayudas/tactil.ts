// `revisarTactil` y `revisarReflujo` (05 §14.4; 11.5, 11.8). El selector no busca un elemento de una prueba: enumera
// todo lo tocable de la pantalla, así que FE-51 no aplica.
import { expect, type Page } from '@playwright/test';

const TOCABLES =
  'button, a:not(p a), input[type="checkbox"], [role="checkbox"], [role="button"], [data-testid^="fila-"]';
const MINIMO_PX = 44;

/** Falla si un tocable visible mide menos de 44 × 44 px y su `data-testid` no está entre las excepciones del diseño. */
export async function revisarTactil(
  page: Page,
  excepciones: readonly string[] = [],
): Promise<void> {
  const chicos = await page.locator(TOCABLES).evaluateAll(
    (nodos, { minimo, fuera }) =>
      nodos.flatMap((n) => {
        const { width, height } = n.getBoundingClientRect();
        const visible = width > 0 && height > 0;
        if (!visible || (width >= minimo && height >= minimo)) return [];
        if (fuera.includes(n.getAttribute('data-testid') ?? '')) return [];
        return [`${n.tagName} «${n.textContent.trim()}» ${width}×${height}`];
      }),
    { minimo: MINIMO_PX, fuera: [...excepciones] },
  );
  expect(chicos).toEqual([]);
}

/** A 320 px de ancho, la página no se desborda horizontalmente. */
export async function revisarReflujo(page: Page): Promise<void> {
  const tamano = page.viewportSize();
  await page.setViewportSize({ width: 320, height: tamano?.height ?? 800 });
  const { scrollWidth, clientWidth } = await page.evaluate(() => {
    const d = document.documentElement;
    return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth };
  });
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  if (tamano) await page.setViewportSize(tamano);
}
