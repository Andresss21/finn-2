// `/presupuesto/estructura/grupos/[grupoId]` (05 §2.3, FT-18, OP-08 y OP-13): renombrar, eliminar o archivar un grupo.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../../../flujos/presupuesto-estructura/lector';
import { estructura } from '../../../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.tituloGrupo };

export default async function PaginaGrupo({
  params,
}: {
  readonly params: Promise<{ readonly grupoId: string }>;
}) {
  return <LectorEstructura modo="grupo" id={(await params).grupoId} />;
}
