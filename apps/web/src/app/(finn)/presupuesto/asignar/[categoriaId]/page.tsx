// `/presupuesto/asignar/[categoriaId]` (05 §2.3, FT-10, OP-14): cambiar lo asignado a una categoría. `?periodo=` es el inicio
// del período (activo o futuro). Abierta directo, recargada o por un deep link es página completa; desde la app la
// intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorAsignar } from '../../../../../flujos/presupuesto-asignar-categoria/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { presupuestoAsignar } from '../../../../../textos/presupuesto-asignar';

export const metadata: Metadata = { title: presupuestoAsignar.titulo };

export default async function PaginaAsignar({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorAsignar categoriaId={(await params).categoriaId} busqueda={await searchParams} />;
}
