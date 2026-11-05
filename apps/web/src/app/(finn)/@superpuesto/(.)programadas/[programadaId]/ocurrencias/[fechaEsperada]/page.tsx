// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorOcurrencia } from '../../../../../../../flujos/programadas-ocurrencias-fecha-esperada/lector';

export default async function OcurrenciaInterceptada({
  params,
}: {
  readonly params: Promise<{ readonly programadaId: string; readonly fechaEsperada: string }>;
}) {
  const { programadaId, fechaEsperada } = await params;
  return <LectorOcurrencia programadaId={programadaId} fechaEsperada={fechaEsperada} superpuesto />;
}
