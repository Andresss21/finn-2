// `/cuentas/[cuentaId]/conciliar` (05 §2.7, FT-43): subir el estado de cuenta en CSV, ver qué coincide y terminar (OP-45, OP-47).
import type { Metadata } from 'next';
import { LectorConciliar } from '../../../../../flujos/cuentas-conciliar/lector';
import { conciliar } from '../../../../../textos/conciliar';

interface Props {
  readonly params: Promise<{ readonly cuentaId: string }>;
}

export const metadata: Metadata = { title: conciliar.titulo };

export default async function PaginaConciliar({ params }: Props) {
  return <LectorConciliar cuentaId={(await params).cuentaId} />;
}
