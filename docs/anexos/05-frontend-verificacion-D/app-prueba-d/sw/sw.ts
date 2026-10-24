/// <reference lib="webworker" />
// Prototipo del service worker de Finn (05 §8). Sin caché de datos: solo el precache de archivos estáticos y /sin-conexion.
import { Serwist, NetworkOnly, type PrecacheEntry } from 'serwist';
import { rutaDeDestino } from '../componentes/navegacion/destinos';
declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: (PrecacheEntry | string)[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,          // FE-55: la versión nueva espera a "Recargar"
  clientsClaim: false,
  navigationPreload: false,
  disableDevLogs: true,
  runtimeCaching: [{ matcher: () => true, handler: new NetworkOnly() }],   // FE-53: nada más se guarda
  fallbacks: { entries: [{ url: '/sin-conexion', matcher: ({ request }) => request.destination === 'document' }] },
});

self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });

interface CargaPush { notificacionId: string; titulo: string; cuerpo: string; etiqueta?: string; destino?: unknown; acciones?: ('confirmar' | 'rechazar')[]; movimientoId?: string }
const TEXTO_ACCION = { confirmar: 'Confirmar', rechazar: 'Rechazar' } as const;

self.addEventListener('push', (e) => {
  let c: CargaPush;
  try { c = e.data!.json(); } catch { c = { notificacionId: '', titulo: 'Finn', cuerpo: 'Tenés una notificación nueva.' }; }
  e.waitUntil(self.registration.showNotification(c.titulo, {
    body: c.cuerpo, tag: c.etiqueta, icon: '/marca/icono-192.png', badge: '/marca/insignia-96.png',
    data: { notificacionId: c.notificacionId, destino: c.destino, movimientoId: c.movimientoId },
    actions: (c.acciones ?? []).map((a) => ({ action: a, title: TEXTO_ACCION[a] })),
  } as NotificationOptions));
});

async function abrir(ruta: string) {
  const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const propia = ventanas.find((v) => new URL(v.url).origin === self.location.origin) as WindowClient | undefined;
  if (propia) {
    const navegada = await propia.navigate(ruta).catch(() => null);     // solo funciona si la ventana está controlada por este service worker
    try { await (navegada ?? propia).focus(); } catch { /* sin activación del usuario */ }
    if (navegada) return;
  }
  return self.clients.openWindow(ruta);
}

self.addEventListener('notificationclick', (e) => {
  const n = e.notification; n.close();
  const { notificacionId, destino, movimientoId } = n.data ?? {};
  if (e.action === 'confirmar' || e.action === 'rechazar') {
    e.waitUntil((async () => {
      let estado = 0;
      try {
        const r = await fetch('/api/notificaciones/accion', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Finn-Accion': '1' },
          body: JSON.stringify({ notificacionId, movimientoId, decision: e.action }) });
        estado = r.status;
      } catch { estado = 0; }
      if (estado === 200) return self.registration.showNotification('Listo', { tag: 'accion-' + notificacionId, body: e.action === 'confirmar' ? 'Confirmaste la coincidencia.' : 'Rechazaste la coincidencia.' });
      if (estado === 401) return abrir('/bandeja');
      return abrir(rutaDeDestino({ pantalla: 'movimiento', movimientoId }, notificacionId));   // 409, 422, red u otro
    })());
    return;
  }
  e.waitUntil(abrir(rutaDeDestino(destino, notificacionId)));
});

serwist.addEventListeners();
