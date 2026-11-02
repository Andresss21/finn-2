// `/presupuesto/categorias/[categoriaId]` (05 §2.3, FT-14): el detalle de una categoría, en el período de `?periodo=` (por
// defecto el activo). Es una página [D]: siempre pantalla completa.
import type { Metadata } from 'next';
import { LectorDetalleCategoria } from './lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

export const metadata: Metadata = { title: categoriaDetalle.titulo };

export default async function PaginaDetalleCategoria({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { categoriaId } = await params;
  return <LectorDetalleCategoria categoriaId={categoriaId} busqueda={await searchParams} />;
}
