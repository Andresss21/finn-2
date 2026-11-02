// `/cuentas` (05 §2.7, FT-51): dónde está el dinero y cuánto se debe. `?archivadas=1` incluye las archivadas.
import type { Metadata } from 'next';
import { LectorCuentas } from './lector';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { cuentas } from '../../../textos/cuentas';

export const metadata: Metadata = { title: cuentas.pantalla.titulo };

export default async function PaginaCuentas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorCuentas busqueda={await searchParams} />;
}
