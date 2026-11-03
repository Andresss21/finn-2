// `/presupuesto/auto-asignar` (05 §2.3, FT-13, OP-17): llenar de una vez las categorías según lo que piden sus metas. `?periodo=` es
// el inicio del período (activo o futuro). Abierta directo, recargada o por un deep link es página completa; desde la app la
// intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorAutoAsignar } from '../../../../flujos/presupuesto-auto-asignar/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { presupuestoAutoAsignar } from '../../../../textos/presupuesto-auto-asignar';

export const metadata: Metadata = { title: presupuestoAutoAsignar.titulo };

export default async function PaginaAutoAsignar({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorAutoAsignar busqueda={await searchParams} />;
}
