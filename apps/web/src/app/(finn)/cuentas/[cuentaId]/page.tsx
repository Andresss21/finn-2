// `/cuentas/[cuentaId]` (05 §2.7, FT-52): movimientos con saldo corrido, conciliaciones, y el bloque de la tarjeta, el préstamo
// o la inversión. `?periodo=&tipo=&estado=&cursor=` son los filtros de `detalleCuenta()`.
import type { Metadata } from 'next';
import { LectorDetalleCuenta } from './lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';

export const metadata: Metadata = { title: cuentaDetalle.titulo };

export default async function PaginaDetalleCuenta({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { cuentaId } = await params;
  return <LectorDetalleCuenta cuentaId={cuentaId} busqueda={await searchParams} />;
}
