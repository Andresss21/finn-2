// `/registrar/[tipo]` (05 §2.4, FT-22, FT-23 y FT-32): ingreso (OP-21), transferencia (OP-22) y los movimientos de tarjeta sin compra (OP-27).
// Los demás valores de `[tipo]` los agregan sus fichas; hasta entonces son `notFound()`.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tipoDeRegistro } from '../../../../flujos/registrar-tipo/campos';
import { LectorRegistrarTipo } from '../../../../flujos/registrar-tipo/lector';
import { tipoDeTarjeta } from '../../../../flujos/registrar-tipo/campos-tarjeta';
import { LectorRegistrarTarjeta } from '../../../../flujos/registrar-tipo/lector-tarjeta';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { registrarTarjeta } from '../../../../textos/registrar-tarjeta';
import { registrarTipo } from '../../../../textos/registrar-tipo';

interface Props {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const url = (await params).tipo;
  const deTarjeta = tipoDeTarjeta(url);
  if (deTarjeta !== undefined) return { title: registrarTarjeta.flujos[deTarjeta].titulo };
  return {
    title:
      tipoDeRegistro(url) === 'transferencia'
        ? registrarTipo.tituloTransferencia
        : registrarTipo.tituloIngreso,
  };
}

export default async function PaginaRegistrarTipo({ params, searchParams }: Props) {
  const url = (await params).tipo;
  const tipo = tipoDeRegistro(url);
  if (tipo !== undefined) return <LectorRegistrarTipo tipo={tipo} busqueda={await searchParams} />;
  const deTarjeta = tipoDeTarjeta(url);
  if (deTarjeta === undefined) notFound();
  return <LectorRegistrarTarjeta tipo={deTarjeta} busqueda={await searchParams} />;
}
