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
  // Para reanudar sin borrador (CA-04.10): los nombres e ids de lo que ya existe, sin los grupos del sistema.
  const existentes = grupos
    .filter((g) => !g.grupo.sistema)
    .map((g) => ({
      id: g.grupo.id,
      nombre: g.grupo.nombre,
      categorias: g.categorias
        .filter((c) => c.clase === 'normal')
        .map((c) => ({ id: c.categoria.id, nombre: c.categoria.nombre })),
    }));
  return (
    <PanelPlantilla hayNormales={normales} existentes={existentes} crearLote={crearPlantilla} />
  );
}
