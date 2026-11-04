// `/reglas` (05 §2, FT-39): las reglas de comercio, con las que apuntan a una categoría archivada marcadas (B-10).
import type { Metadata } from 'next';
import { reglas } from '../../../textos/reglas';
import { LectorReglas } from './lector';

export const metadata: Metadata = { title: reglas.titulo };

export default function PaginaReglas() {
  return <LectorReglas />;
}
