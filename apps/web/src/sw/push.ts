/// <reference lib="webworker" />
// Push en el service worker (05 §8.6, FE-57): el evento `push` siempre muestra una notificación (Chrome exige
// `userVisibleOnly`), el toque navega la ventana abierta o abre una nueva, y "Confirmar"/"Rechazar" llaman a
// `POST /api/notificaciones/accion` (04 §11.5). `pushsubscriptionchange` no se atiende (lo hace `SuscripcionPush`).
import { rutaDeDestino } from '../componentes/navegacion/destinos';
import { notificaciones } from '../textos/notificaciones';

declare const self: ServiceWorkerGlobalScope;

const ACCIONES = ['confirmar', 'rechazar'] as const;
type Accion = (typeof ACCIONES)[number];
const ETIQUETAS = ['sms', 'programadas', 'cierre', 'sistema', 'tarjetas'];
const esTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const ICONOS = { icon: '/marca/icono-192.png', badge: '/marca/insignia-96.png' } as const;

interface DatosNotificacion {
  readonly notificacionId?: string;
  readonly destino?: unknown;
}

/** La carga útil (CP-1, CP-18) ya convertida en lo que se muestra; una carga ilegible da el texto genérico. */
type OpcionesPush = NotificationOptions & { actions?: { action: string; title: string }[] };

export function opcionesDeCarga(carga: unknown): { titulo: string; opciones: OpcionesPush } {
  const c = (typeof carga === 'object' && carga !== null ? carga : {}) as Record<string, unknown>;
  const { notificacionId, titulo, cuerpo } = c;
  if (!esTexto(notificacionId) || !esTexto(titulo) || !esTexto(cuerpo))
    return {
      titulo: notificaciones.push.genericoTitulo,
      opciones: { ...ICONOS, body: notificaciones.push.genericoCuerpo, data: {} },
    };
  const acciones = Array.isArray(c['acciones'])
    ? (c['acciones'] as unknown[]).filter((a): a is Accion => ACCIONES.includes(a as Accion))
    : [];
  const datos: DatosNotificacion = { notificacionId, destino: c['destino'] };
  return {
    titulo,
    opciones: {
      ...ICONOS,
      body: cuerpo,
      ...(ETIQUETAS.includes(c['etiqueta'] as string) ? { tag: c['etiqueta'] as string } : {}),
      data: datos,
      actions: acciones.map((a) => ({ action: a, title: notificaciones.push[a] })),
    },
  };
}

/** Navega la ventana abierta de la app y la enfoca (navegar antes: `focus()` puede fallar sin gesto); si no hay, abre una. */
async function abrir(ruta: string): Promise<void> {
  const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const ventana = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
  if (ventana === undefined) {
    await self.clients.openWindow(ruta);
    return;
  }
  const destino = await ventana.navigate(ruta).catch(() => null);
  await (destino ?? ventana).focus().catch(() => undefined);
}

async function decidir(decision: Accion, datos: DatosNotificacion): Promise<void> {
  const d = datos.destino as { pantalla?: string; movimientoId?: string } | undefined;
  if (d?.pantalla !== 'movimiento' || !esTexto(d.movimientoId)) return abrir('/bandeja');
  const respuesta = await fetch('/api/notificaciones/accion', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Finn-Accion': '1' },
    body: JSON.stringify({
      notificacionId: datos.notificacionId,
      movimientoId: d.movimientoId,
      decision,
    }),
  }).catch(() => null);
  if (respuesta?.status === 200) {
    await self.registration.showNotification(notificaciones.push.listo, {
      ...ICONOS,
      tag: 'finn-listo',
      silent: true,
    });
    return;
  }
  return abrir(respuesta?.status === 401 ? '/bandeja' : `/bandeja/${d.movimientoId}`);
}

export function atenderPush(evento: PushEvent): void {
  let carga: unknown;
  try {
    carga = evento.data?.json();
  } catch {
    carga = undefined;
  }
  const { titulo, opciones } = opcionesDeCarga(carga);
  evento.waitUntil(self.registration.showNotification(titulo, opciones));
}

export function atenderToque(evento: NotificationEvent): void {
  const datos = (evento.notification.data ?? {}) as DatosNotificacion;
  evento.notification.close();
  const accion = ACCIONES.find((a) => a === evento.action);
  evento.waitUntil(
    accion === undefined
      ? abrir(rutaDeDestino(datos.destino, datos.notificacionId))
      : decidir(accion, datos),
  );
}
