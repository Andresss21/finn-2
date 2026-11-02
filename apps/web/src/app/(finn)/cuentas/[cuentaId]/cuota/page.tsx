// `/cuentas/[cuentaId]/cuota` (05 §2.7, FT-54): pagar la cuota de un préstamo o abonar a capital (OP-24).
import type { Metadata } from 'next';
import { LectorCuentasCuota } from '../../../../../flujos/cuentas-cuota/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';
import { cuentasCuota } from '../../../../../textos/cuentas-cuota';

interface Props {
  readonly params: Promise<{ readonly cuentaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { modalidad } = await searchParams;
  return { title: modalidad === 'abono' ? cuentasCuota.tituloAbono : cuentasCuota.tituloCuota };
}

export default async function PaginaCuentasCuota({ params, searchParams }: Props) {
  return <LectorCuentasCuota prestamoId={(await params).cuentaId} busqueda={await searchParams} />;
}
