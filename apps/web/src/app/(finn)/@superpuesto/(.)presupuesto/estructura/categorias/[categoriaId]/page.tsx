// El mismo flujo, interceptado sobre la lista de la estructura cuando se llega desde ella (05 §1.4).
import { LectorEstructura } from '../../../../../../../flujos/presupuesto-estructura/lector';

export default async function CategoriaInterceptada({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorEstructura modo="categoria" id={(await params).categoriaId} superpuesto />;
}
