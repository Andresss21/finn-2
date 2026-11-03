// PRU-E2E-PWA-109 (CH-97; 04 §5.8, 05 §8.1): una escritura invalida solo el árbol de `(finn)`. Se lee la compilación que
// levantó el `webServer`: ninguna ruta estática lleva la etiqueta que invalida `accion()`, toda página de `(finn)` la lleva
// y toda página fuera de `(finn)` es de la lista sin datos. Después, una escritura real por `/pruebas/eco` no regenera
// `/serwist/sw.js`: con `revalidatePath('/', 'layout')` la siguiente respuesta salía `STALE` y Next lo recompilaba (en
// Vercel, la regeneración fallaba con `ERR_MODULE_NOT_FOUND`).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRequestContext } from '@playwright/test';
import { getImplicitTags } from 'next/dist/server/lib/implicit-tags.js';
import { NEXT_CACHE_IMPLICIT_TAG_ID } from 'next/dist/lib/constants.js';
import { expect, test } from './configuracion/semilla.ts';
import { entrarAal2 } from './ayudas/sesion.ts';
import { ARBOL_CON_DATOS } from '../src/servidor/revalidar.ts';

// La forma en que `revalidatePath(ruta, 'layout')` arma la etiqueta (next/dist/server/web/spec-extension/revalidate.js).
const ETIQUETA = `${NEXT_CACHE_IMPLICIT_TAG_ID}${ARBOL_CON_DATOS}${ARBOL_CON_DATOS.endsWith('/') ? '' : '/'}layout`;
const FINN = '/(finn)/';
// Las páginas que no leen datos del motor (05 §1.2): el acceso, sin conexión y las de error de Next.
const SIN_DATOS = [
  '/_global-error/page',
  '/_not-found/page',
  '/ingresar/inscribir/page',
  '/ingresar/page',
  '/ingresar/verificar/page',
  '/sin-conexion/page',
];

/** Cada `.meta` de lo que la compilación dejó prerenderizado, con sus etiquetas. */
function etiquetasEstaticas(dir = '.next/server/app'): Record<string, string[]> {
  const salida: Record<string, string[]> = {};
  for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!e.isFile() || !e.name.endsWith('.meta')) continue;
    const ruta = join(e.parentPath, e.name);
    const meta = JSON.parse(readFileSync(ruta, 'utf8')) as { headers?: Record<string, string> };
    salida[ruta] = (meta.headers?.['x-next-cache-tags'] ?? '').split(',');
  }
  return salida;
}

/** Los argumentos de cada `revalidatePath(…)` del código, fuera de comentarios y de pruebas, con su archivo. */
function llamadosARevalidatePath(dir: string): [string, string][] {
  const salida: [string, string][] = [];
  for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!e.isFile() || !/\.tsx?$/.test(e.name) || /\.test\.tsx?$/.test(e.name)) continue;
    const archivo = join(e.parentPath, e.name);
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
      if (/^\s*(\/\/|\*|\/\*)/.test(linea)) continue;
      for (const m of linea.matchAll(/revalidatePath\(([^)]*)\)/g))
        salida.push([archivo, m[1] ?? '']);
    }
  }
  return salida;
}

async function serviceWorker(
  request: APIRequestContext,
): Promise<{ bytes: Buffer; cache: string }> {
  const r = await request.get('/serwist/sw.js', { maxRedirects: 0 });
  expect(r.status()).toBe(200);
  return { bytes: await r.body(), cache: r.headers()['x-nextjs-cache'] ?? '' };
}

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-109 [V5-03, V5-29] una escritura revalida las páginas de (finn) y no regenera /serwist/sw.js', async ({
    page,
  }) => {
    const estaticas = etiquetasEstaticas();
    const sw = Object.entries(estaticas).find(([r]) => r.endsWith(join('serwist', 'sw.js.meta')));
    expect(sw?.[1]).toContain('_N_T_/serwist/sw.js');
    for (const [ruta, etiquetas] of Object.entries(estaticas))
      expect.soft(etiquetas, ruta).not.toContain(ETIQUETA);

    const rutas = Object.keys(
      JSON.parse(readFileSync('.next/app-path-routes-manifest.json', 'utf8')) as Record<
        string,
        string
      >,
    ).filter((r) => r.endsWith('/page'));
    const deFinn = rutas.filter((r) => r.startsWith(FINN));
    expect(deFinn).toContain(`${FINN}page`);
    expect(rutas.filter((r) => !deFinn.includes(r)).sort()).toEqual(SIN_DATOS);
    for (const r of deFinn)
      expect((await getImplicitTags(r, '', null)).tags, r).toContain(ETIQUETA);
    // Todo `revalidatePath(…, 'layout')` del código usa el árbol de `(finn)`.
    for (const [archivo, llamado] of llamadosARevalidatePath('src'))
      if (llamado.includes("'layout'")) expect(llamado, archivo).toBe("ARBOL_CON_DATOS, 'layout'");

    const antes = await serviceWorker(page.request);
    await page.goto('/pruebas/eco');
    await page.waitForFunction(() => 'next' in window && 'router' in (window.next as object));
    const guardados = Number(/Guardados: (\d+)/.exec(await page.locator('main').innerText())?.[1]);
    await page.getByLabel('Texto').fill('ch-97');
    await page.getByRole('button', { name: 'Guardar' }).click();
    // V5-03a: la página se actualiza con la respuesta de la acción, sin recargar.
    await expect(page.getByText(`Guardados: ${guardados + 1}`)).toBeVisible();

    for (const despues of [await serviceWorker(page.request), await serviceWorker(page.request)]) {
      expect(despues.cache).not.toBe('STALE');
      expect(despues.bytes.equals(antes.bytes)).toBe(true);
    }
  });
});
