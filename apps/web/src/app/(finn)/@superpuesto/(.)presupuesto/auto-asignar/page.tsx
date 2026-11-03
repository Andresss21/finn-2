// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorAutoAsignar } from '../../../../../flujos/presupuesto-auto-asignar/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';

export default async function AutoAsignarInterceptado({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorAutoAsignar busqueda={await searchParams} superpuesto />;
}
