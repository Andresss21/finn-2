// `/ajustes/instituciones/[institucionId]` (05 §2.11, FT-73): renombrar una institución (OPT-07). Flujo corto.
import type { Metadata } from 'next';
import { LectorInstitucion } from '../../../../../flujos/ajustes-instituciones-institucion/lector';
import { ajustesInstituciones } from '../../../../../textos/ajustes-instituciones';

export const metadata: Metadata = { title: ajustesInstituciones.tituloEditar };

export default async function PaginaInstitucion({
  params,
}: {
  readonly params: Promise<{ readonly institucionId: string }>;
}) {
  return <LectorInstitucion institucionId={(await params).institucionId} />;
}
