// `/presupuesto/categorias/[categoriaId]/sacar` (05 §2.3, FT-19, OP-11): sacar el dinero de una categoría archivada. Abierta
// directo, recargada o por un deep link es página completa; desde la app la intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorSacar } from '../../../../../../flujos/presupuesto-categorias-sacar/lector';
import { categoriasArchivar } from '../../../../../../textos/categorias-archivar';

export const metadata: Metadata = { title: categoriasArchivar.sacar.titulo };

export default async function PaginaSacar({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorSacar categoriaId={(await params).categoriaId} />;
}
