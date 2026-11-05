// `/cuentas/[cuentaId]/pagar` (05 §2.7, FT-30): pagar una tarjeta desde una cuenta de efectivo (OP-23).
import type { Metadata } from 'next';
import { LectorCuentasPagar } from '../../../../../flujos/cuentas-pagar/lector';
import { cuentasPagar } from '../../../../../textos/cuentas-pagar';

interface Props {
  readonly params: Promise<{ readonly cuentaId: string }>;
}

export const metadata: Metadata = { title: cuentasPagar.tituloGenerico };

export default async function PaginaCuentasPagar({ params }: Props) {
  return <LectorCuentasPagar tarjetaId={(await params).cuentaId} />;
}
