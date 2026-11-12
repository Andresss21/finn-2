// El mismo flujo, interceptado como hoja o panel sobre Seguridad cuando se llega desde la app (05 §1.4, CH-240 E2-8).
import { LectorQuitarFactor } from '../../../../../../../../flujos/ajustes-seguridad-factores-quitar/lector';

export default async function QuitarFactorInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly factorId: string }>;
}) {
  return <LectorQuitarFactor factorId={(await params).factorId} superpuesto />;
}
