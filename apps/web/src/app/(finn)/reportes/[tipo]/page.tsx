// `/reportes/[tipo]` (05 §2.10, FT-60): un reporte de 04 §6.9.2. `?ventana=`, `?cuentas=`, `?grupo=` (categorías) y `?limite=`
// (comercios). Un `[tipo]` fuera de la tabla es `notFound()`; un parámetro inválido se quita (05 §2.2).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { reportes } from '../../../../textos/reportes';
import { LectorReporte } from './lector';
import { esTipoDeUrl } from './tipos';

interface Props {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo } = await params;
  return { title: esTipoDeUrl(tipo) ? reportes.titulos[tipo] : reportes.titulo };
}

export default async function PaginaReporte({ params, searchParams }: Props) {
  const { tipo } = await params;
  if (!esTipoDeUrl(tipo)) return notFound();
  return <LectorReporte url={tipo} busqueda={await searchParams} />;
}
