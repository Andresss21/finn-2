// `/metas` (05 §2.3, FT-17): las metas del período activo, las vencidas primero (AV-17).
import type { Metadata } from 'next';
import { metas } from '../../../textos/metas';
import { LectorMetas } from './lector';

export const metadata: Metadata = { title: metas.titulo };

export default function PaginaMetas() {
  return <LectorMetas />;
}
