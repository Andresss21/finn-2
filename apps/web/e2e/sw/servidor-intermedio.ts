// Un servidor intermedio entre el navegador y la app de la E2E (05 §8.8): Playwright no aplica `setOffline` a los pedidos
// del service worker (hallazgo de V5-30), así que "servidor detenido" se logra con otro origen que pasa los pedidos a la
// app y que la prueba cierra. También permite publicar una "versión 2" del service worker sin una segunda compilación
// (cambia sus bytes) y simular que el servidor nuevo ya no tiene un archivo de la versión 1 (V5-33b).
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

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
