// Traducción de DestinoNotificacion (CP-1) a rutas (05 §3.5). Compartida por el centro de notificaciones y el service worker.
export type DestinoNotificacion =
  | { pantalla: 'inicio' } | { pantalla: 'bandeja' }
  | { pantalla: 'movimiento'; movimientoId: string } | { pantalla: 'transaccion'; transaccionId: string }
  | { pantalla: 'programada'; programadaId: string; fechaEsperada?: string }
  | { pantalla: 'presupuesto'; periodoInicio: string } | { pantalla: 'categoria'; categoriaId: string; periodoInicio?: string }
  | { pantalla: 'diagnostico' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, FECHA = /^\d{4}-\d{2}-\d{2}$/;
export function rutaDeDestino(d: unknown, notificacionId?: string): string {
  const con = (r: string) => notificacionId && UUID.test(notificacionId) ? r + (r.includes('?') ? '&' : '?') + 'notificacion=' + notificacionId : r;
  const x = d as Record<string, string> | null;
  switch (x?.pantalla) {
    case 'inicio': return con('/');
    case 'bandeja': return con('/bandeja');
    case 'movimiento': if (UUID.test(x.movimientoId ?? '')) return con(`/bandeja/${x.movimientoId}`); break;
    case 'transaccion': if (UUID.test(x.transaccionId ?? '')) return con(`/actividad/${x.transaccionId}`); break;
    case 'programada': if (UUID.test(x.programadaId ?? '')) return con(x.fechaEsperada && FECHA.test(x.fechaEsperada) ? `/programadas/${x.programadaId}/ocurrencias/${x.fechaEsperada}` : `/programadas/${x.programadaId}`); break;
    case 'presupuesto': if (FECHA.test(x.periodoInicio ?? '')) return con(`/presupuesto?periodo=${x.periodoInicio}`); break;
    case 'categoria': if (UUID.test(x.categoriaId ?? '')) return con(`/presupuesto/categorias/${x.categoriaId}` + (x.periodoInicio && FECHA.test(x.periodoInicio) ? `?periodo=${x.periodoInicio}` : '')); break;
    case 'diagnostico': return con('/ajustes/diagnostico');
  }
  return con('/notificaciones');
}
