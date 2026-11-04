// `/ajustes/formatos/[formatoId]` (05 §2.11, FT-73): editar, activar o desactivar un formato (OPT-05) y probarlo (OPT-06). Flujo largo.
import type { Metadata } from 'next';
import { LectorFormato } from '../../../../../flujos/ajustes-formatos-formato/lector';
import { ajustesFormatos } from '../../../../../textos/ajustes-formatos';

export const metadata: Metadata = { title: ajustesFormatos.tituloEditar };

export default async function PaginaFormato({
  params,
}: {
  readonly params: Promise<{ readonly formatoId: string }>;
}) {
  return <LectorFormato formatoId={(await params).formatoId} />;
}
