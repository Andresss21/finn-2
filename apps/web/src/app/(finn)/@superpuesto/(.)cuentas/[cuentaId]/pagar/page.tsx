// El mismo flujo, interceptado sobre el detalle de la tarjeta cuando se llega desde la app (05 §1.4, GLO-23).
import { LectorCuentasPagar } from '../../../../../../flujos/cuentas-pagar/lector';

export default async function PagarInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasPagar tarjetaId={(await params).cuentaId} superpuesto />;
}
