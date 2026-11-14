// `/reglas` (05 §2, FT-39): las reglas de comercio, con las que apuntan a una categoría archivada marcadas (B-10).
// [CH-227 b] `?q=` filtra la lista en el lector, sin cambiar la consulta.
import type { Metadata } from 'next';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { reglas } from '../../../textos/reglas';
import { LectorReglas } from './lector';

export const metadata: Metadata = { title: reglas.titulo };

const NOMBRE_MAXIMO = 60;

export default async function PaginaReglas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { q, eliminada } = await searchParams;
  // [CH-281] `?eliminada=` es el comercio de la regla que se eliminó (C-50 §8): de la interfaz, no llega a la consulta
  const nombre = typeof eliminada === 'string' ? eliminada.trim().slice(0, NOMBRE_MAXIMO) : '';
  return (
    <LectorReglas
      q={typeof q === 'string' ? q.trim() : ''}
      {...(nombre === '' ? {} : { eliminada: nombre })}
    />
  );
}
