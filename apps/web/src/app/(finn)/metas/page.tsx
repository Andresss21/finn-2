// `/metas` (05 §2.3, FT-17): las metas del período activo, las vencidas primero (AV-17).
import type { Metadata } from 'next';
import { metas } from '../../../textos/metas';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { LectorMetas } from './lector';

export const metadata: Metadata = { title: metas.titulo };

export default async function PaginaMetas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const busqueda = await searchParams;
  const aviso = busqueda['resultado'];
  const nombre = busqueda['nombre']; // [CH-281] la categoría de la meta eliminada
  return (
    <LectorMetas
      resultado={typeof aviso === 'string' ? aviso : undefined}
      nombre={typeof nombre === 'string' ? nombre : undefined}
    />
  );
}
