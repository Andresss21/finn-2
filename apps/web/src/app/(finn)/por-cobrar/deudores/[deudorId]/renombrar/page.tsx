// `/por-cobrar/deudores/[deudorId]/renombrar` (05 §2, FT-48): corregir el nombre de un deudor (OP-52). Es un flujo corto.
import type { Metadata } from 'next';
import { LectorPorCobrarRenombrar } from '../../../../../../flujos/por-cobrar-deudores-renombrar/lector';
import { porCobrarRenombrar } from '../../../../../../textos/por-cobrar';

export const metadata: Metadata = { title: porCobrarRenombrar.titulo };

export default async function PaginaPorCobrarRenombrar({
  params,
}: {
  readonly params: Promise<{ readonly deudorId: string }>;
}) {
  return <LectorPorCobrarRenombrar deudorId={(await params).deudorId} />;
}
