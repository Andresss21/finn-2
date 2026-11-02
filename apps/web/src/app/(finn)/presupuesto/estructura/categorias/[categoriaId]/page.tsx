// `/presupuesto/estructura/categorias/[categoriaId]` (05 §2.3, FT-18, OP-08 y OP-13): renombrar, mover de grupo o eliminar.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../../../flujos/presupuesto-estructura/lector';
import { estructura } from '../../../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.tituloCategoria };

export default async function PaginaCategoria({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorEstructura modo="categoria" id={(await params).categoriaId} />;
}
