// [CH-281] C-50 (AVISO-DE-RESULTADO §7 y §8): la etiqueta de resultado se va sola a los `--duracion-aviso` ms; la frase completa
// queda en la región `role="status"` de la pantalla hasta la siguiente acción, así que las pruebas leen el resultado ahí y la
// etiqueta solo mientras se ve. `pantalla` es el `data-anuncio` de la región: «bandeja», o el id de la fila que se fue.
import type { Page } from '@playwright/test';

export const anuncio = (page: Page, pantalla: string) =>
  page.locator(`[data-anuncio="${pantalla}"]`);

export const etiqueta = (page: Page) => page.locator('[data-etiqueta]');
