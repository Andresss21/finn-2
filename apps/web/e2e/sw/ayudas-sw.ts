// Ayudas de las pruebas del service worker (05 §8.8): nunca un tiempo fijo, siempre una condición (07 §7.1).
import { expect, type Page } from '@playwright/test';

/** Visita `url`, espera a que el service worker esté activo y recarga para que la página quede controlada por él. */
export async function visitarControlada(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

/** Las rutas de todo lo que guardan las cachés del navegador (05 §8.3), con su nombre de caché. */
export async function contenidoDeLasCaches(
  page: Page,
): Promise<{ caches: string[]; rutas: string[] }> {
  return page.evaluate(async () => {
    const nombres = await caches.keys();
    const rutas: string[] = [];
    for (const nombre of nombres) {
      const cache = await caches.open(nombre);
      for (const peticion of await cache.keys()) rutas.push(new URL(peticion.url).pathname);
    }
    return { caches: nombres, rutas };
  });
}
