// `/actividad/[transaccionId]/eventos/eliminar` (05 §2.6, FT-28): eliminar un cobro, una condonación o una devolución de la compra (OP-34),
// previsualizando primero. `?tipo-evento=` y `?evento=` dicen cuál (R2). Flujo corto.
import type { Metadata } from 'next';
import { LectorEventosEliminar } from '../../../../../../flujos/actividad-eventos-eliminar/lector';
import type { BusquedaDePagina } from '../../../../../../servidor/parametros';
import { transaccion } from '../../../../../../textos/transaccion';

export const metadata: Metadata = { title: transaccion.eliminarEventoTitulo };

const texto = (v: string | readonly string[] | undefined): string | undefined =>
  typeof v === 'string' ? v : undefined;

export default async function PaginaEventosEliminar({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly transaccionId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const b = await searchParams;
  return (
    <LectorEventosEliminar
      transaccionId={(await params).transaccionId}
      tipo={texto(b['tipo-evento'])}
      evento={texto(b['evento'])}
      volver={texto(b['volver'])}
    />
  );
}
