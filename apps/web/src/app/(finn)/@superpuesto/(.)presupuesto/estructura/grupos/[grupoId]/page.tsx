// El mismo flujo, interceptado sobre la lista de la estructura cuando se llega desde ella (05 §1.4).
import { LectorEstructura } from '../../../../../../../flujos/presupuesto-estructura/lector';

export default async function GrupoInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly grupoId: string }>;
}) {
  return <LectorEstructura modo="grupo" id={(await params).grupoId} superpuesto />;
}
