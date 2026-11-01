/// <reference lib="webworker" />
// Service worker de Finn (05 §8.1, §8.3, FE-53, FE-55). Solo precache de archivos estáticos y `/sin-conexion`: ninguna
// página, respuesta RSC ni `/api/*` se guarda (FE-20, ADR-13). No usa `defaultCache` (guarda datos). La versión nueva
// espera a "Recargar" (`skipWaiting: false`, `clientsClaim: false`). El push es de la Parte D (FE-57).
import { NetworkOnly, Serwist, type PrecacheEntry } from 'serwist';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: (PrecacheEntry | string)[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: false,
  disableDevLogs: true,
  // Una sola regla: todo lo demás va solo a la red.
  runtimeCaching: [{ matcher: () => true, handler: new NetworkOnly() }],
  // Navegación de documento sin red: `/sin-conexion` (8.5).
  fallbacks: {
    entries: [
      { url: '/sin-conexion', matcher: ({ request }) => request.destination === 'document' },
    ],
  },
});

// "Recargar" (8.4, paso 5): activa la versión que espera.
self.addEventListener('message', (evento) => {
  if ((evento.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});

serwist.addEventListeners();
