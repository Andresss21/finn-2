// `/registrar/[tipo]` (05 §2.4): los flujos cortos de `ingreso` (OP-21, FT-22), `transferencia` (OP-22, FT-23) y de inversión
// (`aporte-inversion`, `retiro-inversion` y `ajuste-inversion`, OP-25, FT-57). Los demás valores de `[tipo]` (desembolso, tarjeta,
// devolución) los agregan sus fichas; hasta entonces son `notFound()`.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { modalidadDe, tipoDeInversion } from '../../../../flujos/registrar-tipo/inversion-campos';
import { LectorRegistrarInversion } from '../../../../flujos/registrar-tipo/inversion-lector';
import { tipoDeRegistro } from '../../../../flujos/registrar-tipo/campos';
import { LectorRegistrarTipo } from '../../../../flujos/registrar-tipo/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { registrarInversion } from '../../../../textos/registrar-inversion';
import { registrarTipo } from '../../../../textos/registrar-tipo';

interface Props {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const url = (await params).tipo;
  const inversion = tipoDeInversion(url);
  if (inversion !== undefined) return { title: registrarInversion.titulo[modalidadDe(inversion)] };
  const tipo = tipoDeRegistro(url);
  return {
    title:
      tipo === 'transferencia' ? registrarTipo.tituloTransferencia : registrarTipo.tituloIngreso,
  };
}

export default async function PaginaRegistrarTipo({ params, searchParams }: Props) {
  const url = (await params).tipo;
  const inversion = tipoDeInversion(url);
  if (inversion !== undefined)
    return <LectorRegistrarInversion tipo={inversion} busqueda={await searchParams} />;
  const tipo = tipoDeRegistro(url);
  if (tipo === undefined) notFound();
  return <LectorRegistrarTipo tipo={tipo} busqueda={await searchParams} />;
}
