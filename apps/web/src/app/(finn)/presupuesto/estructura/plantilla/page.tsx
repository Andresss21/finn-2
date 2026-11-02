// `/presupuesto/estructura/plantilla` (05 §2.3, FT-04, CF-08): la lista sugerida de categorías, para empezar. Flujo largo.
import { estructura } from '@finn/aplicacion/consultas/estructura';
import type { Metadata } from 'next';
import { PanelPlantilla } from '../../../../../flujos/presupuesto-estructura-plantilla/plantilla';
import { crearPlantilla } from '../../../../../servidor/acciones/categorias';
import { consultar } from '../../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../../servidor/consultas';
import { plantilla } from '../../../../../textos/plantilla';

export const metadata: Metadata = { title: plantilla.titulo };

export default async function PaginaDePlantilla() {
  const { grupos } = await consultar(async () => estructura(await depsDeConsulta()));
  const normales = grupos.some((g) => g.categorias.some((c) => c.clase === 'normal'));
  return <PanelPlantilla hayNormales={normales} crearLote={crearPlantilla} />;
}
