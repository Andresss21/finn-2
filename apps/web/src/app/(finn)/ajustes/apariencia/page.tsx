// `/ajustes/apariencia` (05 §2.11, FT-77): tema del dispositivo; sin consultas ni escrituras en el servidor.
import type { Metadata } from 'next';
import { PaginaApariencia } from './pagina';
import { ajustesApariencia } from '../../../../textos/ajustes-apariencia';

export const metadata: Metadata = { title: ajustesApariencia.titulo };

export default function PaginaAjustesApariencia() {
  return <PaginaApariencia />;
}
