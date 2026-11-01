// `/presupuesto/estructura/categorias/nueva` (05 §2.3, FT-18, OP-07): crear una categoría; `?grupo=` propone su grupo.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../../../flujos/presupuesto-estructura/lector';
import type { BusquedaDePagina } from '../../../../../../servidor/parametros';
import { estructura } from '../../../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.tituloCategoriaNueva };

export default async function PaginaCategoriaNueva({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { grupo } = await searchParams;
  return (
    <LectorEstructura modo="categoria-nueva" {...(typeof grupo === 'string' ? { grupo } : {})} />
  );
}
