// `/presupuesto/categorias/[categoriaId]/fusionar` (05 §2.3, FT-20, OP-12): fusionar una categoría en otra viendo antes qué cambia.
// Es un flujo largo: siempre página completa (05 §1.4).
import type { Metadata } from 'next';
import { LectorFusionar } from '../../../../../../flujos/presupuesto-categorias-fusionar/lector';
import { categoriasFusionar } from '../../../../../../textos/categorias-fusionar';

export const metadata: Metadata = { title: categoriasFusionar.titulo };

export default async function PaginaFusionar({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorFusionar categoriaId={(await params).categoriaId} />;
}
