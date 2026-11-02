// `/metas/[metaId]` (05 §2.3, FT-17): editar o eliminar una meta (OP-18); extender la fecha o ajustar el monto de una vencida.
import type { Metadata } from 'next';
import { LectorMetasMeta } from '../../../../flujos/metas-meta/lector';
import { metas } from '../../../../textos/metas';

export const metadata: Metadata = { title: metas.tituloEditar };

export default async function PaginaMetasMeta({
  params,
}: {
  readonly params: Promise<{ readonly metaId: string }>;
}) {
  return <LectorMetasMeta metaId={(await params).metaId} />;
}
