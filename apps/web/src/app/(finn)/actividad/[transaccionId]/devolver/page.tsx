// `/actividad/[transaccionId]/devolver` (05 §2.6, FT-28): registrar la devolución de una compra, repartida entre sus partes (OP-33a). Flujo largo.
import type { Metadata } from 'next';
import { LectorActividadDevolver } from '../../../../../flujos/actividad-devolver/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { transaccion } from '../../../../../textos/transaccion';

export const metadata: Metadata = { title: transaccion.devolverTitulo };

export default async function PaginaActividadDevolver({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { volver } = await searchParams;
  return (
    <LectorActividadDevolver
      transaccionId={(await params).transaccionId}
      volver={typeof volver === 'string' ? volver : undefined}
    />
  );
}
