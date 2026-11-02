// Control de `esperarContenido` (05 §14.4; 07 §7.1): la espera solo da por resuelta una frontera cuyo contenido terminó en
// `notFound()` (un `div[hidden]#S:n` sin elementos propios). Un contenido oculto real, una frontera sin resolver o el estado de
// carga siguen contando como pendientes: si dejara de esperarlos, PRU-E2E-PWA-007 volvería a medir una pantalla de 0×0.
import { expect, test, type Page } from '@playwright/test';
import { esperarContenido } from '../ayudas/esperas.ts';

const documento = (cuerpo: string): string =>
  `<!doctype html><html data-hidratado="si"><body>${cuerpo}</body></html>`;
const abrir = (page: Page, cuerpo: string) => page.setContent(documento(cuerpo));

test.describe('PRU-E2E-PWA esperas', () => {
  test('PRU-E2E-PWA-105 esperarContenido ignora el div oculto vacío que deja un notFound() y sigue esperando el contenido oculto real, la frontera sin resolver y el estado de carga', async ({
    page,
  }) => {
    // Lo que dejó React tras un `notFound()` en streaming: la pantalla ya está dibujada y no hay nada pendiente
    await abrir(
      page,
      '<main>Esto ya no existe.</main><div hidden id="S:0"><template id="P:1"></template><!--$--><!--/$--></div>',
    );
    await esperarContenido(page);

    // Contenido real que sigue oculto, frontera sin resolver y estado de carga: no se dan por resueltos
    for (const pendiente of [
      '<div hidden id="S:0"><section>Contenido que todavía no se muestra</section></div>',
      '<template id="B:0"></template><div>Cargando</div>',
      '<div role="status" aria-busy="true">Cargando</div>',
    ]) {
      await abrir(page, pendiente);
      await expect(esperarContenido(page), pendiente).rejects.toThrow();
    }
  });
});
