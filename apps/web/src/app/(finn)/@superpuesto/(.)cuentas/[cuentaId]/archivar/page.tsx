// El mismo flujo, interceptado sobre el detalle de la cuenta cuando se llega desde la app (05 §1.4, GLO-23).
import { LectorCuentasArchivar } from '../../../../../../flujos/cuentas-archivar/lector';

export default async function ArchivarInterceptado({
  params,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
}) {
  return <LectorCuentasArchivar cuentaId={(await params).cuentaId} superpuesto />;
}
