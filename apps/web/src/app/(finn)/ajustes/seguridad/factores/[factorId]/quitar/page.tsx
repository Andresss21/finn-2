// `/ajustes/seguridad/factores/[factorId]/quitar` (05 §2.11, §9.6, FT-74): quitar un factor TOTP. Flujo corto, con confirmación.
import type { Metadata } from 'next';
import { LectorQuitarFactor } from '../../../../../../../flujos/ajustes-seguridad-factores-quitar/lector';
import { seguridad } from '../../../../../../../textos/seguridad';

export const metadata: Metadata = { title: seguridad.tituloQuitar };

export default async function PaginaQuitarFactor({
  params,
}: {
  readonly params: Promise<{ readonly factorId: string }>;
}) {
  return <LectorQuitarFactor factorId={(await params).factorId} />;
}
