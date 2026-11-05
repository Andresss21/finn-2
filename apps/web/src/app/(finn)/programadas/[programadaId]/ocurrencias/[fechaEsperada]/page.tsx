// `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (05 §2, FT-41): registrar con un toque u omitir (OP-43, OP-44). Directa
// es página completa; desde la app la intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorOcurrencia } from '../../../../../../flujos/programadas-ocurrencias-fecha-esperada/lector';
import { programadas } from '../../../../../../textos/programadas';

export const metadata: Metadata = { title: programadas.titulo };

export default async function PaginaOcurrencia({
  params,
}: {
  readonly params: Promise<{ readonly programadaId: string; readonly fechaEsperada: string }>;
}) {
  const { programadaId, fechaEsperada } = await params;
  return <LectorOcurrencia programadaId={programadaId} fechaEsperada={fechaEsperada} />;
}
