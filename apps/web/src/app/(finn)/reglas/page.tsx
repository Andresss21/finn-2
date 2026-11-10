// `/reglas` (05 §2, FT-39): las reglas de comercio, con las que apuntan a una categoría archivada marcadas (B-10).
// [CH-227 b] `?q=` filtra la lista en el lector, sin cambiar la consulta.
import type { Metadata } from 'next';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { reglas } from '../../../textos/reglas';
import { LectorReglas } from './lector';

export const metadata: Metadata = { title: reglas.titulo };

export default async function PaginaReglas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { q } = await searchParams;
  return <LectorReglas q={typeof q === 'string' ? q.trim() : ''} />;
}
