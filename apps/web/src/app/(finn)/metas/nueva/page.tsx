// `/metas/nueva` (05 §2.3, FT-17): crear la meta de una categoría (OP-18). La categoría inicial viene de `?categoria=` [R2].
import type { Metadata } from 'next';
import { LectorMetasNueva } from '../../../../flujos/metas-nueva/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { metas } from '../../../../textos/metas';

export const metadata: Metadata = { title: metas.tituloNueva };

export default async function PaginaMetasNueva({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorMetasNueva busqueda={await searchParams} />;
}
