// `/presupuesto/estructura` (05 §2.3, FT-18): administrar grupos y categorías. Flujo largo, siempre pantalla completa.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../flujos/presupuesto-estructura/lector';
import { estructura } from '../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.titulo };

export default function PaginaEstructura() {
  return <LectorEstructura modo="lista" />;
}
