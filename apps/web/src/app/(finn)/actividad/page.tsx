// `/actividad` (05 §2.6, FT-24): todas las transacciones por día, con búsqueda y filtros en la URL (05 §2.2).
import type { Metadata } from 'next';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { actividad } from '../../../textos/actividad';
import { LectorActividad } from './lector';

export const metadata: Metadata = { title: actividad.titulo };

export default async function PaginaActividad({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorActividad busqueda={await searchParams} />;
}
