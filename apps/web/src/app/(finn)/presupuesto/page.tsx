// `/presupuesto` (05 §2.3, FT-09): el presupuesto de un período. `?periodo=` (inicio del período) y
// `?filtro=sobregiradas|sin-fondos|cubiertas`. Es una página [P]: siempre pantalla completa.
import type { Metadata } from 'next';
import { LectorPresupuesto } from './lector';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { presupuesto } from '../../../textos/presupuesto';

export const metadata: Metadata = { title: presupuesto.titulo };

export default async function PaginaPresupuesto({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorPresupuesto busqueda={await searchParams} />;
}
