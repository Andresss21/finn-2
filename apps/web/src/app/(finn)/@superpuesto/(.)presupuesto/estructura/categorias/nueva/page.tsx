// El mismo flujo, interceptado sobre la lista de la estructura cuando se llega desde ella (05 §1.4).
import { LectorEstructura } from '../../../../../../../flujos/presupuesto-estructura/lector';
import type { BusquedaDePagina } from '../../../../../../../servidor/parametros';

export default async function CategoriaNuevaInterceptada({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { grupo } = await searchParams;
  return (
    <LectorEstructura
      modo="categoria-nueva"
      superpuesto
      {...(typeof grupo === 'string' ? { grupo } : {})}
    />
  );
}
