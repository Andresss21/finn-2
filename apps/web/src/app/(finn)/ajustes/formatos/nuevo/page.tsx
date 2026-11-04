// `/ajustes/formatos/nuevo` (05 §2.11, FT-73): crear un formato bancario (OPT-05) y probarlo (OPT-06). Flujo largo: siempre página completa.
import type { Metadata } from 'next';
import { LectorFormatoNuevo } from '../../../../../flujos/ajustes-formatos-nuevo/lector';
import { ajustesFormatos } from '../../../../../textos/ajustes-formatos';

export const metadata: Metadata = { title: ajustesFormatos.tituloNuevo };

export default function PaginaFormatoNuevo() {
  return <LectorFormatoNuevo />;
}
