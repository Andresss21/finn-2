// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorMover } from '../../../../../flujos/presupuesto-mover/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';

export default async function MoverInterceptado({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorMover busqueda={await searchParams} superpuesto />;
}
