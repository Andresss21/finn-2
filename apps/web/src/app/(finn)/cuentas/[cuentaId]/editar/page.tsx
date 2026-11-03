// `/cuentas/[cuentaId]/editar` (05 §2.7, FT-53): editar los datos de una cuenta (OP-02). Es un flujo largo: siempre página completa.
import type { Metadata } from 'next';
import { LectorCuentasEditar } from '../../../../../flujos/cuentas-editar/lector';
import { cuentasGestion } from '../../../../../textos/cuentas-gestion';

export const metadata: Metadata = { title: cuentasGestion.editar.titulo };

export default async function PaginaCuentasEditar({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasEditar cuentaId={(await params).cuentaId} />;
}
