// `/reglas/nueva` (05 §2, FT-39): crear una regla de comercio (OP-41), sin esperar a aprobar un SMS.
import type { Metadata } from 'next';
import { LectorReglasNueva } from '../../../../flujos/reglas-nueva/lector';
import { reglas } from '../../../../textos/reglas';

export const metadata: Metadata = { title: reglas.tituloNueva };

export default function PaginaReglasNueva() {
  return <LectorReglasNueva />;
}
