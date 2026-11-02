// `/cuentas/[cuentaId]/verificar-saldo` (05 §2.7, FT-44): escribir el saldo que muestra el banco a una fecha (OP-53). `?fecha=`.
import type { Metadata } from 'next';
import { LectorVerificarSaldo } from '../../../../../flujos/cuentas-verificar-saldo/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { verificarSaldo } from '../../../../../textos/verificar-saldo';

interface Props {
  readonly params: Promise<{ readonly cuentaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export const metadata: Metadata = { title: verificarSaldo.titulo };

export default async function PaginaVerificarSaldo({ params, searchParams }: Props) {
  return <LectorVerificarSaldo cuentaId={(await params).cuentaId} busqueda={await searchParams} />;
}
