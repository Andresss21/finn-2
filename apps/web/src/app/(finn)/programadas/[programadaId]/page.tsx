// `/programadas/[programadaId]` (05 §2, FT-40): editar, desactivar, reactivar o eliminar una programada (OP-42, OP-51). Flujo largo.
import type { Metadata } from 'next';
import { LectorProgramada } from '../../../../flujos/programadas-programada/lector';
import { programadas } from '../../../../textos/programadas';

export const metadata: Metadata = { title: programadas.titulo };

export default async function PaginaProgramada({
  params,
}: {
  readonly params: Promise<{ readonly programadaId: string }>;
}) {
  return <LectorProgramada programadaId={(await params).programadaId} />;
}
