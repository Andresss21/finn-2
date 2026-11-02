// `/presupuesto/mover` (05 §2.3, FT-11, OP-15): pasar dinero de una categoría a otra. `?categoria-origen=`, `?categoria-destino=`
// y `?periodo=` (activo o futuro). Abierta directo, recargada o por un deep link es página completa; desde la app la
// intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorMover } from '../../../../flujos/presupuesto-mover/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { presupuestoMover } from '../../../../textos/presupuesto-mover';

export const metadata: Metadata = { title: presupuestoMover.titulo };

export default async function PaginaMover({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorMover busqueda={await searchParams} />;
}
