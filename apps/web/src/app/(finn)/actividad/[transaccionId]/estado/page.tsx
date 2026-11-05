// `/actividad/[transaccionId]/estado` (05 §2.6, FT-26): cambiar el estado bancario de una transacción (OP-30). Flujo corto.
import type { Metadata } from 'next';
import { LectorActividadEstado } from '../../../../../flujos/actividad-estado/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { transaccion } from '../../../../../textos/transaccion';

export const metadata: Metadata = { title: transaccion.estadoTitulo };

export default async function PaginaActividadEstado({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { volver } = await searchParams;
  return (
    <LectorActividadEstado
      transaccionId={(await params).transaccionId}
      volver={typeof volver === 'string' ? volver : undefined}
    />
  );
}
