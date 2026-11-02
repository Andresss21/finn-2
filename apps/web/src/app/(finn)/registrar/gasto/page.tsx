// `/registrar/gasto` (05 §2.4, FT-21): registrar un gasto con división y por cobrar (OP-20). Flujo largo: página completa. La ruta
// estática gana a `/registrar/[tipo]`, que atiende ingreso y transferencia.
import type { Metadata } from 'next';
import { LectorRegistrarGasto } from '../../../../flujos/registrar-gasto/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { registrarGasto } from '../../../../textos/registrar-gasto';

export const metadata: Metadata = { title: registrarGasto.tituloGasto };

export default async function PaginaRegistrarGasto({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorRegistrarGasto busqueda={await searchParams} />;
}
