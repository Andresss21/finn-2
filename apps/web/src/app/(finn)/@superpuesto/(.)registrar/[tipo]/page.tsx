// El mismo flujo corto de `/registrar/[tipo]`, interceptado sobre `/registrar` cuando se llega desde allí (05 §1.4). El segmento
// dinámico también atrapa `/registrar/gasto` (un flujo largo, siempre página completa) y los valores que no son de este flujo: esos
// se vuelven a abrir como página completa, que es la que decide si existe (`/registrar/gasto`) o da `notFound()`.
import { AbrirComoPagina } from '../../../../../componentes/navegacion/flujo-de-ruta';
import { tipoDeInversion } from '../../../../../flujos/registrar-tipo/inversion-campos';
import { LectorRegistrarInversion } from '../../../../../flujos/registrar-tipo/inversion-lector';
import { tipoDeRegistro } from '../../../../../flujos/registrar-tipo/campos';
import { LectorRegistrarTipo } from '../../../../../flujos/registrar-tipo/lector';
import type { BusquedaDePagina } from '../../../../../servidor/parametros';

export default async function RegistrarTipoInterceptado({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const url = (await params).tipo;
  const inversion = tipoDeInversion(url);
  if (inversion !== undefined)
    return <LectorRegistrarInversion tipo={inversion} busqueda={await searchParams} superpuesto />;
  const tipo = tipoDeRegistro(url);
  if (tipo === undefined) return <AbrirComoPagina />;
  return <LectorRegistrarTipo tipo={tipo} busqueda={await searchParams} superpuesto />;
}
