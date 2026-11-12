// El mismo flujo, interceptado sobre el detalle de la cuenta cuando se llega desde la app (05 §1.4, GLO-23).
import { LectorCuentasEliminar } from '../../../../../../flujos/cuentas-eliminar/lector';

export default async function EliminarInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasEliminar cuentaId={(await params).cuentaId} superpuesto />;
}
