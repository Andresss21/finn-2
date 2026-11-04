// Lector de `/reglas/nueva` (05 §2, §4.1): las categorías que acepta una regla (normales y activas), de `formulario()` sin
// ids propios. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioReglaNueva, type GrupoCategorias } from './formulario';

/** Las categorías del catálogo de gastos agrupadas, para el selector: solo nombres e ids (PF-3). */
export async function gruposParaRegla(): Promise<readonly GrupoCategorias[]> {
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'registrar', tipo: 'gasto' }),
  );
  return (dto.catalogos.categorias?.grupos ?? []).map((g) => ({
    nombre: g.grupo.nombre,
    categorias: g.categorias.map((c) => ({ id: c.categoria.id, nombre: c.categoria.nombre })),
  }));
}

export async function LectorReglasNueva() {
  return <FormularioReglaNueva grupos={await gruposParaRegla()} />;
}
