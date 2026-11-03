// `/actividad/[transaccionId]/editar` (05 §2.6, FT-25): corregir cualquier campo de una transacción (OP-28). Es un flujo largo: siempre
// página completa (05 §1.4).
import type { Metadata } from 'next';
import { LectorActividadEditar } from '../../../../../flujos/actividad-editar/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { transaccion } from '../../../../../textos/transaccion';

export const metadata: Metadata = { title: transaccion.editarTitulo };

export default async function PaginaActividadEditar({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { volver } = await searchParams;
  return (
    <LectorActividadEditar
      transaccionId={(await params).transaccionId}
      volver={typeof volver === 'string' ? volver : undefined}
    />
  );
}
