// `/cuentas/nueva` (05 §2.3, FT-50): crear una cuenta con su saldo inicial. El tipo inicial viene de `?tipo-cuenta=` [R2].
import type { Metadata } from 'next';
import { LectorCuentaNueva } from '../../../../flujos/cuentas-nueva/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { cuentasNueva } from '../../../../textos/cuentas-nueva';

export const metadata: Metadata = { title: cuentasNueva.titulo };

export default async function PaginaCuentaNueva({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return <LectorCuentaNueva busqueda={await searchParams} />;
}
