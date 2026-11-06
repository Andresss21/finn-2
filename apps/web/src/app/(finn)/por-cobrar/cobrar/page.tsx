// `/por-cobrar/cobrar` (05 §2, FT-46): cobrar una partida por cobrar, en efectivo o en una tarjeta (OP-31).
// `?linea=`, `?deudor=` y `?fecha=` los lee el lector.
import type { Metadata } from 'next';
import { LectorPorCobrarCobrar } from '../../../../flujos/por-cobrar-cobrar/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { porCobrarCobrar } from '../../../../textos/por-cobrar-cobrar';

export const metadata: Metadata = { title: porCobrarCobrar.tituloGenerico };

export default async function PaginaPorCobrarCobrar({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorPorCobrarCobrar busqueda={await searchParams} />;
}
