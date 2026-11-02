// `/presupuesto/categorias/[categoriaId]/archivar` (05 §2.3, FT-19, OP-09): archivar una categoría resolviendo su dinero, sus
// asignaciones futuras y sus programadas. Es un flujo largo: siempre página completa (05 §1.4).
import type { Metadata } from 'next';
import { LectorArchivar } from '../../../../../../flujos/presupuesto-categorias-archivar/lector';
import { categoriasArchivar } from '../../../../../../textos/categorias-archivar';

export const metadata: Metadata = { title: categoriasArchivar.titulo };

export default async function PaginaArchivar({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorArchivar categoriaId={(await params).categoriaId} />;
}
