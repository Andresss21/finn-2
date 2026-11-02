// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorAsignar } from '../../../../../../flujos/presupuesto-asignar-categoria/lector';
import type { BusquedaDePagina } from '../../../../../../servidor/parametros';

export default async function AsignarInterceptado({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return (
    <LectorAsignar
      categoriaId={(await params).categoriaId}
      busqueda={await searchParams}
      superpuesto
    />
  );
}
