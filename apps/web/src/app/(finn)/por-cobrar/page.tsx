// `/por-cobrar` (05 §2, FT-45): lo que te deben, por deudor, y el dinero en camino. `?cerrados=1` incluye los cerrados.
import type { Metadata } from 'next';
import { LectorPorCobrar } from './lector';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { porCobrar } from '../../../textos/por-cobrar';

export const metadata: Metadata = { title: porCobrar.titulo };

export default async function PaginaPorCobrar({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorPorCobrar busqueda={await searchParams} />;
}
