// El mismo flujo, interceptado sobre el detalle de la cuenta cuando se llega desde la app (05 §1.4, GLO-23).
import { LectorVerificarSaldo } from '../../../../../../flujos/cuentas-verificar-saldo/lector';
import type { BusquedaDePagina } from '../../../../../../servidor/parametros';

export default async function VerificarSaldoInterceptado({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly cuentaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  return (
    <LectorVerificarSaldo
      cuentaId={(await params).cuentaId}
      busqueda={await searchParams}
      superpuesto
    />
  );
}
