// `/por-cobrar/condonar/[lineaId]` (05 §2, FT-47, OP-32): condonar lo que queda abierto de una partida. Abierta directo, recargada o por un
// deep link es página completa; desde la app la intercepta `@superpuesto` (05 §1.4).
import type { Metadata } from 'next';
import { LectorCondonar } from '../../../../../flujos/por-cobrar-condonar-linea/lector';
import { porCobrarCondonar } from '../../../../../textos/por-cobrar-condonar';

export const metadata: Metadata = { title: porCobrarCondonar.condonar };

export default async function PaginaCondonar({
  params,
}: {
  readonly params: Promise<{ readonly lineaId: string }>;
}) {
  return <LectorCondonar lineaId={(await params).lineaId} />;
}
