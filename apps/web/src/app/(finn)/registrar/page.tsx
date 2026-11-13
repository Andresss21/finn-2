// `/registrar` (05 §2.4, FT-21): elegir qué registrar. Enlaza a `/registrar/gasto`, `/registrar/ingreso` y `/registrar/transferencia`.
import type { Metadata } from 'next';
import { LectorRegistrar } from '../../../flujos/registrar/lector';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { registrarGasto } from '../../../textos/registrar-gasto';

export const metadata: Metadata = { title: registrarGasto.titulo };

export default async function PaginaRegistrar({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorRegistrar busqueda={await searchParams} />;
}
