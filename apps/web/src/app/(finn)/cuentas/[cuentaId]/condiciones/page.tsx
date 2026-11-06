// `/cuentas/[cuentaId]/condiciones` (05 §2.7, FT-55): registrar o editar las condiciones de un préstamo (OP-48). Es un flujo largo.
import type { Metadata } from 'next';
import { LectorCuentasCondiciones } from '../../../../../flujos/cuentas-condiciones/lector';
import { cuentasCondiciones } from '../../../../../textos/cuentas-condiciones';

export const metadata: Metadata = { title: cuentasCondiciones.titulo };

export default async function PaginaCuentasCondiciones({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasCondiciones cuentaId={(await params).cuentaId} />;
}
