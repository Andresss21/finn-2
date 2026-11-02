// `/registrar/[tipo]` (05 §2.4, FT-22 y FT-23): el flujo corto de `ingreso` (OP-21) y de `transferencia` (OP-22). Los demás
// valores de `[tipo]` (inversión, desembolso, tarjeta, devolución) los agregan sus fichas; hasta entonces son `notFound()`.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tipoDeRegistro } from '../../../../flujos/registrar-tipo/campos';
import { LectorRegistrarTipo } from '../../../../flujos/registrar-tipo/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { registrarTipo } from '../../../../textos/registrar-tipo';

interface Props {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tipo = tipoDeRegistro((await params).tipo);
  return {
    title:
      tipo === 'transferencia' ? registrarTipo.tituloTransferencia : registrarTipo.tituloIngreso,
  };
}

export default async function PaginaRegistrarTipo({ params, searchParams }: Props) {
  const tipo = tipoDeRegistro((await params).tipo);
  if (tipo === undefined) notFound();
  return <LectorRegistrarTipo tipo={tipo} busqueda={await searchParams} />;
}
