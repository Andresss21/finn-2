// Lector de `/presupuesto/categorias/[categoriaId]/fusionar` (05 §2.3, §4.1): llama a `formulario({ operacion: 'fusionar' })` (el
// origen, los destinos válidos y el resumen de lo que se mueve, 04 §6.14.4) y pasa el DTO al formulario. Lo único que traduce los
// errores de las consultas es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { fusionarCategorias } from '../../servidor/acciones/categorias';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioFusionar } from './formulario';

export async function LectorFusionar({ categoriaId }: { readonly categoriaId: string }) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'fusionar', categoriaId }),
    { validacionDeSegmento: true },
  );
  const { origen, destinosValidos, resumen } = dto.contexto;
  return (
    <FormularioFusionar
      accion={fusionarCategorias}
      origen={{ id: origen.id, nombre: origen.nombre }}
      destinos={destinosValidos.map((d) => ({ id: d.id, nombre: d.nombre }))}
      resumen={resumen}
    />
  );
}
