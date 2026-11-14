// `/presupuesto/estructura` (05 §2.3, FT-18): administrar grupos y categorías. Flujo largo, siempre pantalla completa.
// [CH-270] `?resultado=` es lo que dejó crear un grupo o una categoría; lo valida `leerResultadoEstructura`.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../flujos/presupuesto-estructura/lector';
import { leerResultadoEstructura } from '../../../../flujos/presupuesto-estructura/resultado';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { estructura } from '../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.titulo };

export default async function PaginaEstructura({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { resultado } = await searchParams;
  const leido = leerResultadoEstructura(typeof resultado === 'string' ? resultado : undefined);
  return <LectorEstructura modo="lista" {...(leido === undefined ? {} : { resultado: leido })} />;
}
