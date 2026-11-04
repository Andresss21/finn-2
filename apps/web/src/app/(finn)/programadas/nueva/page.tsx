// `/programadas/nueva` (05 §2, FT-40): crear una programada (OP-42). Es un flujo largo: siempre página completa (05 §1.4).
import type { Metadata } from 'next';
import { LectorProgramada } from '../../../../flujos/programadas-nueva/lector';
import { programadas } from '../../../../textos/programadas';

export const metadata: Metadata = { title: programadas.tituloNueva };

export default function PaginaProgramadaNueva() {
  return <LectorProgramada />;
}
