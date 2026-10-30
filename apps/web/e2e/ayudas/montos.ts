// `esperarMonto` (05 §14.4; 14.3): comprueba un número sin depender del formato. `formatearMontoAccesible` (10.8) llega
// con el componente `Monto`; quien lo use pasa su resultado como `textoAccesible` y la dueña lo vuelve obligatorio.
import { expect, type Locator } from '@playwright/test';

export async function esperarMonto(
  localizador: Locator,
  centavos: number,
  textoAccesible?: string,
): Promise<void> {
  await expect(localizador).toHaveAttribute('data-centavos', String(centavos));
  if (textoAccesible !== undefined) await expect(localizador).toContainText(textoAccesible);
}
