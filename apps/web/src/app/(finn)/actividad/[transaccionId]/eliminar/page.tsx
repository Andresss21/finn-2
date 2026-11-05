// `/actividad/[transaccionId]/eliminar` (05 §2.6, FT-26): eliminar una transacción (OP-29), previsualizando primero. Flujo corto.
import type { Metadata } from 'next';
import { LectorActividadEliminar } from '../../../../../flujos/actividad-eliminar/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { transaccion } from '../../../../../textos/transaccion';

export const metadata: Metadata = { title: transaccion.eliminarTitulo };

export default async function PaginaActividadEliminar({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { volver } = await searchParams;
  return (
    <LectorActividadEliminar
      transaccionId={(await params).transaccionId}
      volver={typeof volver === 'string' ? volver : undefined}
    />
  );
}
