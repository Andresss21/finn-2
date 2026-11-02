// `revisarAccesibilidad` (05 §14.4): axe con las etiquetas de 05 §11.10; falla con la lista de violaciones.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { esperarContenido } from './esperas.ts';

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function revisarAccesibilidad(page: Page): Promise<void> {
  await esperarContenido(page);
  const { violations } = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}
