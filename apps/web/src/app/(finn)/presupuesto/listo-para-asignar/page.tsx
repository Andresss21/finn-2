// `/presupuesto/listo-para-asignar` (05 §2.3, FT-15): cómo se compone Listo para asignar y su historial. `?historial=` es la
// cantidad de períodos (1 a 60). Es una página [D]: siempre pantalla completa.
import type { Metadata } from 'next';
import { LectorListoParaAsignar } from './lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { listoParaAsignar } from '../../../../textos/listo-para-asignar';

export const metadata: Metadata = { title: listoParaAsignar.titulo };

export default async function PaginaListoParaAsignar({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorListoParaAsignar busqueda={await searchParams} />;
}
