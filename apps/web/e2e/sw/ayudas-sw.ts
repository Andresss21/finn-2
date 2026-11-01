// Un servidor intermedio entre el navegador y la app de la E2E (05 §8.8): Playwright no aplica `setOffline` a los pedidos
// del service worker (hallazgo de V5-30), así que "servidor detenido" se logra con otro origen que pasa los pedidos a la
// app y que la prueba cierra. También permite publicar una "versión 2" del service worker sin una segunda compilación
// (cambia sus bytes) y simular que el servidor nuevo ya no tiene un archivo de la versión 1 (V5-33b).
// Ayudas de las pruebas del service worker (05 §8.8): nunca un tiempo fijo, siempre una condición (07 §7.1).
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
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

export interface ServidorIntermedio {
  readonly origen: string;
  /** Desde ahora `/serwist/sw.js` cambia de bytes: el navegador lo ve como una versión nueva. */
  publicarVersion2(): void;
  /** Desde ahora la ruta responde 404, como un archivo que la versión nueva ya no tiene. */
  quitar(ruta: string): void;
  cerrar(): Promise<void>;
}

export async function levantarServidorIntermedio(destino: string): Promise<ServidorIntermedio> {
  let version2 = false;
  const quitadas = new Set<string>();
  const servidor: Server = createServer((peticion, respuesta) => {
    void (async () => {
      const ruta = peticion.url ?? '/';
      if (quitadas.has(new URL(ruta, destino).pathname)) {
        respuesta.writeHead(404).end();
        return;
      }
      const origen = await fetch(new URL(ruta, destino), {
        method: peticion.method ?? 'GET',
        headers: { cookie: peticion.headers.cookie ?? '' },
        redirect: 'manual',
      });
      let cuerpo = Buffer.from(await origen.arrayBuffer());
      if (version2 && new URL(ruta, destino).pathname === '/serwist/sw.js')
        cuerpo = Buffer.concat([cuerpo, Buffer.from('\n/* version 2 */\n')]);
      const cabeceras: Record<string, string> = {};
      origen.headers.forEach((valor, nombre) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(nombre))
          cabeceras[nombre] = valor;
      });
      respuesta.writeHead(origen.status, cabeceras).end(cuerpo);
    })().catch(() => {
      respuesta.writeHead(502).end();
    });
  });
  await new Promise<void>((listo) => servidor.listen(0, 'localhost', listo));
  const { port } = servidor.address() as AddressInfo;
  return {
    origen: `http://localhost:${port}`,
    publicarVersion2: () => {
      version2 = true;
    },
    quitar: (ruta) => {
      quitadas.add(ruta);
    },
    cerrar: () =>
      new Promise<void>((listo) => {
        servidor.close(() => {
          listo();
        });
        servidor.closeAllConnections();
      }),
  };
}
