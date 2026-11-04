// `/notificaciones` (05 §2.9, FT-69): el centro de notificaciones, con `?no-leidas=1` y `?cursor=` en la URL (05 §2.2).
import type { Metadata } from 'next';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { notificaciones } from '../../../textos/notificaciones';
import { LectorNotificaciones } from './lector';

export const metadata: Metadata = { title: notificaciones.titulo };

export default async function PaginaNotificaciones({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorNotificaciones busqueda={await searchParams} />;
}
