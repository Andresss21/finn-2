// `/bandeja/[movimientoId]` (05 §2.5, FT-35): revisar un movimiento completo, editarlo y aprobarlo (OP-36, OP-37). Flujo largo:
// siempre página completa (05 §1.4).
import type { Metadata } from 'next';
import { LectorMovimiento } from '../../../../flujos/bandeja-movimiento/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { bandeja } from '../../../../textos/bandeja';

export const metadata: Metadata = { title: bandeja.revisar.titulo };

export default async function PaginaMovimiento({
  params,
  searchParams,
}: {
  readonly params: Promise<{ movimientoId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { traspaso } = await searchParams;
  return (
    <LectorMovimiento movimientoId={(await params).movimientoId} traspaso={traspaso === '1'} />
  );
}
