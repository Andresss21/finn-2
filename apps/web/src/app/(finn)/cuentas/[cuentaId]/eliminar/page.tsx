// `/cuentas/[cuentaId]/eliminar` (05 §2.7, FT-53): eliminar una cuenta (OP-06), previsualizando primero. Con bloqueos ofrece archivar.
import type { Metadata } from 'next';
import { LectorCuentasEliminar } from '../../../../../flujos/cuentas-eliminar/lector';
import { cuentasGestion } from '../../../../../textos/cuentas-gestion';

export const metadata: Metadata = { title: cuentasGestion.eliminar.titulo };

export default async function PaginaCuentasEliminar({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasEliminar cuentaId={(await params).cuentaId} />;
}
