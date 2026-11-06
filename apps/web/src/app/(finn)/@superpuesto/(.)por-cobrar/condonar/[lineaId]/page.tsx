// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorCondonar } from '../../../../../../flujos/por-cobrar-condonar-linea/lector';

export default async function CondonarInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly lineaId: string }>;
}) {
  return <LectorCondonar lineaId={(await params).lineaId} superpuesto />;
}
