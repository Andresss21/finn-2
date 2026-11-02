// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde la app (05 §1.4).
import { LectorSacar } from '../../../../../../../flujos/presupuesto-categorias-sacar/lector';

export default async function SacarInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly categoriaId: string }>;
}) {
  return <LectorSacar categoriaId={(await params).categoriaId} superpuesto />;
}
