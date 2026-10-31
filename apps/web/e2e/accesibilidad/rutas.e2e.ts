// PRU-E2E-PWA-007 y PRU-E2E-PWA-008 (07 §19.8; 05 §11.10, §14.4; FE-46): recorre el árbol real de `app/(finn)` (más las rutas
// públicas de `app/`) y en cada ruta comprueba axe en los dos temas, el tamaño táctil de 44 px y el reflujo a 320 px, y el
// movimiento reducido. Los dos tamaños son los proyectos `movil` y `escritorio`. Como PRU-SEG-ACCESO-002, una ruta nueva entra sola.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { revisarAccesibilidad } from '../ayudas/accesibilidad.ts';
import { revisarReflujo, revisarTactil } from '../ayudas/tactil.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';

const ID = '00000000-0000-4000-8000-000000000001';

/** Los `page.tsx` de `(finn)` y las rutas públicas de `app/`: sin grupos ni `@slots`, ni intercepciones; `/api` no es pantalla. */
function rutasDeLaApp(): string[] {
  const raiz = fileURLToPath(new URL('../../src/app/', import.meta.url));
  const urls = new Set<string>();
  for (const archivo of readdirSync(raiz, { recursive: true, encoding: 'utf8' })) {
    const partes = archivo.replaceAll('\\', '/').split('/');
    if (!/^page\.tsx?$/.test(partes.pop() ?? '')) continue;
    if (partes[0] === 'api') continue;
    if (partes.some((s) => s.startsWith('@') || /^\(\.+\)/.test(s))) continue;
    const tramos = partes.filter((s) => !/^\(.*\)$/.test(s));
    urls.add(`/${tramos.map((s) => (s.startsWith('[') ? ID : s)).join('/')}`);
  }
  return [...urls].sort();
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

test.describe('PRU-E2E-PWA', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-007 [V5-24] cada ruta cumple axe en los dos temas, el tamaño táctil y el reflujo a 320 px', async ({
    page,
  }) => {
    const rutas = rutasDeLaApp();
    expect(rutas).toEqual(expect.arrayContaining(['/', '/pruebas/origen']));
    // CI corre solo el proyecto `movil` (07 §3.2): los dos tamaños de 11.10 se cubren aquí, el del proyecto y el de escritorio
    const tamanos = [page.viewportSize(), { width: 1280, height: 800 }];
    for (const tamano of tamanos) {
      if (tamano) await page.setViewportSize(tamano);
      for (const ruta of rutas) {
        for (const tema of ['light', 'dark'] as const) {
          await page.emulateMedia({ colorScheme: tema });
          await abrir(page, ruta);
          await test.step(`${ruta} (${tema}, ${String(tamano?.width)} px): axe`, () =>
            revisarAccesibilidad(page));
          if (tema === 'light') {
            // El primer Tab llega a «Saltar al contenido» (11.2), que solo se ve con foco: se mide ya visible
            await page.keyboard.press('Tab');
            await test.step(`${ruta}: tamaño táctil`, () => revisarTactil(page));
            await test.step(`${ruta}: reflujo a 320 px`, () => revisarReflujo(page));
          }
        }
      }
    }
  });

  test('PRU-E2E-PWA-008 [V5-27] con movimiento reducido ningún elemento de ninguna ruta anima ni hace transición', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const ruta of rutasDeLaApp()) {
      await abrir(page, ruta);
      const animados = await page.evaluate(() =>
        [...document.querySelectorAll('*')].flatMap((n) => {
          const e = getComputedStyle(n);
          const dura = (v: string): boolean => v.split(',').some((t) => parseFloat(t) > 0);
          return e.animationName !== 'none' || dura(e.transitionDuration)
            ? [`${n.tagName.toLowerCase()} ${e.animationName} ${e.transitionDuration}`]
            : [];
        }),
      );
      expect(animados, ruta).toEqual([]);
    }
  });
});
