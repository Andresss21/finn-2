// `/actividad/[transaccionId]` (05 §2.6, FT-25): el detalle de una transacción, con su origen, su reparto y sus eventos. `?volver=` es la
// pantalla de la que se vino (05 §3.3).
import type { Metadata } from 'next';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { transaccion } from '../../../../textos/transaccion';
import { LectorDetalleTransaccion } from './lector';

export const metadata: Metadata = { title: transaccion.titulo };

export default async function PaginaDetalleTransaccion({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { volver } = await searchParams;
  return (
    <LectorDetalleTransaccion
      transaccionId={(await params).transaccionId}
      volver={typeof volver === 'string' ? volver : undefined}
    />
  );
}
