// `/reglas/[reglaId]` (05 §2, FT-39): corregir o eliminar una regla de comercio (OP-41).
import type { Metadata } from 'next';
import { LectorReglasRegla } from '../../../../flujos/reglas-regla/lector';
import { reglas } from '../../../../textos/reglas';

export const metadata: Metadata = { title: reglas.tituloEditar };

export default async function PaginaReglasRegla({
  params,
}: {
  readonly params: Promise<{ readonly reglaId: string }>;
}) {
  return <LectorReglasRegla reglaId={(await params).reglaId} />;
}
