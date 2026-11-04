// Ayudas de espera por estado (05 §14.4): nunca un tiempo fijo (07 §7.1). Los atributos son el contrato de 05 §14.3.
import { expect, type Page, type Response } from '@playwright/test';

// El `redirect()` que llega después del primer envío (una página bajo un `loading.tsx`, como `/presupuesto/mover` y
// `/reportes`) deja este meta en el documento; el navegador sigue al destino, casi siempre con un documento nuevo.
const META_REDIRECCION = /<meta[^>]*id="__next-page-redirect"[^>]*content="\d+;url=([^"]+)"/;

/**
 * [CH-104] `page.goto(ruta)` y además la redirección que esa ruta hace desde el navegador. `goto` termina con el `load` del
 * primer documento; el del destino llega después, y una evaluación que corre en el medio muere con «Execution context was
 * destroyed» (PRU-E2E-PWA-008). Espera, por eventos, a que haya cargado todo documento recibido y a que el último no
 * redirija o ya esté en su destino (Next a veces llega por navegación del cliente, sin documento nuevo).
 */
export async function irAlDocumentoFinal(page: Page, ruta: string): Promise<void> {
  const destinos: Promise<string | null>[] = []; // por documento: a dónde redirige, o null
  let cargas = 0;
  const alResponder = (r: Response): void => {
    const redireccionHttp = r.status() >= 300 && r.status() < 400; // no carga: la sigue el mismo pedido
    if (!r.request().isNavigationRequest() || r.frame() !== page.mainFrame() || redireccionHttp)
      return;
    destinos.push(
      r.text().then(
        (html) => {
          const url = META_REDIRECCION.exec(html)?.[1];
          return url === undefined ? null : new URL(url.replaceAll('&amp;', '&'), r.url()).href;
        },
        // Un cuerpo que ya no se puede leer es de un documento que otro reemplazó: decide ese otro
        () => 'reemplazado',
      ),
    );
  };
  const alCargar = (): void => {
    cargas += 1;
  };
  page.on('response', alResponder);
  page.on('load', alCargar);
  try {
    await page.goto(ruta);
    await expect
      .poll(
        async () => {
          const destino = await destinos.at(-1);
          const listo = cargas >= destinos.length && (destino === null || destino === page.url());
          return (
            listo ||
            `${String(cargas)} cargas, ${String(destinos.length)} documentos, en ${page.url()}, destino ${String(destino)}`
          );
        },
        { message: ruta },
      )
      .toBe(true);
  } finally {
    page.off('response', alResponder);
    page.off('load', alCargar);
  }
}

/** `data-hidratado="si"` en `<html>`: lo pone el marco en su primer efecto. */
export async function esperarHidratacion(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-hidratado', 'si');
}

/**
 * El contenido de la ruta ya está en pantalla. El marco hidrata antes de que llegue una página que consulta datos: mientras se
 * transmite, `loading.tsx` ocupa su lugar y lo que React ya envió espera oculto, midiendo 0×0. El estado de carga (FE-33) lleva
 * `aria-busy`; cada frontera sin resolver deja `template#B:n` y su contenido en espera, `div[hidden]#S:n`. Ambos ya están en el
 * primer envío, así que no hay un momento en que falten y el contenido siga pendiente. Un `div[hidden]#S:n` sin ningún
 * elemento propio (solo su `template` y comentarios) es lo que deja una frontera cuyo contenido terminó en `notFound()`: la
 * pantalla «Esto ya no existe.» ya está dibujada y no hay nada pendiente.
 */
export async function esperarContenido(page: Page): Promise<void> {
  await esperarHidratacion(page);
  await expect(
    page.locator(
      '[aria-busy="true"], template[id^="B:"], div[hidden][id^="S:"]:has(> :not(template))',
    ),
  ).toHaveCount(0);
}

/** Espera a que `data-revision` cambie después de una escritura o de un refresco (6.3, 6.7). */
export async function esperarRevisionNueva(page: Page, anterior: string): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-revision', /.+/);
  await expect(page.locator('html')).not.toHaveAttribute('data-revision', anterior);
}
