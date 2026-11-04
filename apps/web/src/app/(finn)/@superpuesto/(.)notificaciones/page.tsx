// El mismo centro de notificaciones, interceptado como panel sobre la pantalla de origen cuando se llega desde la campana
// (05 §1.4, CF-23): cerrar es `router.back()` y la pantalla de abajo sigue montada.
import { LectorNotificaciones } from '../../notificaciones/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';

export default async function NotificacionesInterceptado({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorNotificaciones busqueda={await searchParams} superpuesto />;
}
