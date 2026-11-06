// `/registrar/[tipo]` (05 §2.4): ingreso (OP-21, FT-22), transferencia (OP-22, FT-23), los movimientos de tarjeta sin compra (OP-27, FT-32)
// y aporte, retiro y ajuste de inversión (OP-25, FT-57). Los demás valores de `[tipo]` los agregan sus fichas; hasta entonces son `notFound()`.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { modalidadDe, tipoDeInversion } from '../../../../flujos/registrar-tipo/inversion-campos';
import { LectorRegistrarInversion } from '../../../../flujos/registrar-tipo/inversion-lector';
import { tipoDeRegistro } from '../../../../flujos/registrar-tipo/campos';
import { LectorRegistrarTipo } from '../../../../flujos/registrar-tipo/lector';
import { tipoDeTarjeta } from '../../../../flujos/registrar-tipo/campos-tarjeta';
import { LectorRegistrarTarjeta } from '../../../../flujos/registrar-tipo/lector-tarjeta';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { registrarInversion } from '../../../../textos/registrar-inversion';
import { registrarTarjeta } from '../../../../textos/registrar-tarjeta';
import { registrarTipo } from '../../../../textos/registrar-tipo';

interface Props {
  readonly params: Promise<{ readonly tipo: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const url = (await params).tipo;
  const inversion = tipoDeInversion(url);
  if (inversion !== undefined) return { title: registrarInversion.titulo[modalidadDe(inversion)] };
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
  const inversion = tipoDeInversion(url);
  if (inversion !== undefined)
    return <LectorRegistrarInversion tipo={inversion} busqueda={await searchParams} />;
  const tipo = tipoDeRegistro(url);
  if (tipo !== undefined) return <LectorRegistrarTipo tipo={tipo} busqueda={await searchParams} />;
  const deTarjeta = tipoDeTarjeta(url);
  if (deTarjeta === undefined) notFound();
  return <LectorRegistrarTarjeta tipo={deTarjeta} busqueda={await searchParams} />;
}
