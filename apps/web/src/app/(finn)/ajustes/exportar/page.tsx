// `/ajustes/exportar` (05 §2.11, FT-75): descargar las transacciones y el presupuesto en JSON y CSV (OPT-08).
import type { Metadata } from 'next';
import { LectorExportar } from '../../../../flujos/ajustes-exportar/lector';
import { ajustesExportar } from '../../../../textos/ajustes-exportar';

export const metadata: Metadata = { title: ajustesExportar.titulo };

export default function PaginaExportar() {
  return <LectorExportar />;
}
