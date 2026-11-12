// `/metas/[metaId]` (05 §2.3, FT-17): editar o eliminar una meta (OP-18); extender la fecha o ajustar el monto de una vencida.
// `?enfocar=fecha|monto` (E4-18): «Extender la fecha» y «Ajustar el monto» de AV-17 abren esta hoja con ese campo con el foco.
import type { Metadata } from 'next';
import { LectorMetasMeta } from '../../../../flujos/metas-meta/lector';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { metas } from '../../../../textos/metas';

export const metadata: Metadata = { title: metas.titulo };

export default async function PaginaMetasMeta({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly metaId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const pedido = (await searchParams)['enfocar'];
  return (
    <LectorMetasMeta
      metaId={(await params).metaId}
      enfocar={pedido === 'fecha' ? 'fechaObjetivo' : pedido === 'monto' ? 'monto' : undefined}
    />
  );
}
