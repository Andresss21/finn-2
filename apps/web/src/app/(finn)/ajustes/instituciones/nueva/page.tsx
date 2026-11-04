// `/ajustes/instituciones/nueva` (05 §2.11, FT-73): crear una institución (OPT-07). Flujo corto; no necesita datos del servidor.
import type { Metadata } from 'next';
import { LectorInstitucionNueva } from '../../../../../flujos/ajustes-instituciones-nueva/lector';
import { ajustesInstituciones } from '../../../../../textos/ajustes-formatos';

export const metadata: Metadata = { title: ajustesInstituciones.tituloNueva };

export default function PaginaInstitucionNueva() {
  return <LectorInstitucionNueva />;
}
