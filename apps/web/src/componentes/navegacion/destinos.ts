// Destinos de las notificaciones (05 §3.5, FE-32): `DestinoNotificacion` (CP-1) → ruta. Lo usan el service worker y el centro de
// notificaciones, así que no importa nada de React ni de Next. Un destino que no valida se trata como ausente.
import { destinoNotificacion, type DestinoNotificacion } from '@finn/aplicacion/contratos';

export const RUTA_CENTRO = '/notificaciones';

function rutaBase(d: DestinoNotificacion): string {
  switch (d.pantalla) {
    case 'inicio':
      return '/';
    case 'bandeja':
      return '/bandeja';
    case 'movimiento':
      return `/bandeja/${d.movimientoId}`;
    case 'transaccion':
      return `/actividad/${d.transaccionId}`;
    case 'programada':
      return d.fechaEsperada === undefined
        ? `/programadas/${d.programadaId}`
        : `/programadas/${d.programadaId}/ocurrencias/${d.fechaEsperada}`;
    case 'presupuesto':
      return `/presupuesto?periodo=${d.periodoInicio}`;
    case 'categoria':
      return `/presupuesto/categorias/${d.categoriaId}${d.periodoInicio === undefined ? '' : `?periodo=${d.periodoInicio}`}`;
    case 'diagnostico':
      return '/ajustes/diagnostico';
    case 'cuenta':
      return `/cuentas/${d.cuentaId}`;
  }
}

/** La ruta del destino, con `?notificacion=<id>` para marcarla leída al abrir. Sin destino válido: el centro, sin marca. */
export function rutaDeDestino(destino: unknown, notificacionId?: string): string {
  const v = destinoNotificacion.safeParse(destino);
  if (!v.success) return RUTA_CENTRO;
  const ruta = rutaBase(v.data);
  if (notificacionId === undefined) return ruta;
  return `${ruta}${ruta.includes('?') ? '&' : '?'}notificacion=${encodeURIComponent(notificacionId)}`;
}
