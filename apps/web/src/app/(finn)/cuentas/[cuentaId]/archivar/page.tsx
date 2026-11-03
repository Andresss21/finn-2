// `/cuentas/[cuentaId]/archivar` (05 §2.7, FT-53): archivar una cuenta (OP-04). Es un flujo corto: con bloqueos los explica.
import type { Metadata } from 'next';
import { LectorCuentasArchivar } from '../../../../../flujos/cuentas-archivar/lector';
import { cuentasGestion } from '../../../../../textos/cuentas-gestion';

export const metadata: Metadata = { title: cuentasGestion.archivar.titulo };

export default async function PaginaCuentasArchivar({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasArchivar cuentaId={(await params).cuentaId} />;
}
