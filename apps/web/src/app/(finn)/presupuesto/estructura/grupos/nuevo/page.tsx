// `/presupuesto/estructura/grupos/nuevo` (05 §2.3, FT-18, OP-07): crear un grupo.
import type { Metadata } from 'next';
import { LectorEstructura } from '../../../../../../flujos/presupuesto-estructura/lector';
import { estructura } from '../../../../../../textos/estructura';

export const metadata: Metadata = { title: estructura.tituloGrupoNuevo };

export default function PaginaGrupoNuevo() {
  return <LectorEstructura modo="grupo-nuevo" />;
}
