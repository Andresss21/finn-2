// Lector de `/presupuesto/categorias/[categoriaId]/archivar` (05 §2.3, §4.1): llama a `formulario({ operacion: 'archivar_categoria' })`
// (lo que pide OP-09: Disponible, asignaciones futuras y programadas activas, 04 §6.14.4) y pasa el DTO al formulario. Lo único que
// traduce los errores de las consultas es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { archivarCategoria } from '../../servidor/acciones/categorias';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioArchivar } from './formulario';

export async function LectorArchivar({ categoriaId }: { readonly categoriaId: string }) {
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), { operacion: 'archivar_categoria', categoriaId }),
    { validacionDeSegmento: true },
  );
  const { contexto, catalogos } = dto;
  const destinos = (catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias
      .filter((x) => x.categoria.id !== categoriaId)
      .map((x) => ({
        id: x.categoria.id,
        nombre: x.categoria.nombre,
        disponible: x.disponible,
      })),
  );
  return (
    <FormularioArchivar
      accion={archivarCategoria}
      categoriaId={categoriaId}
      categoria={contexto.categoria.nombre}
      disponible={contexto.disponible}
      futuras={contexto.asignacionesFuturas.length}
      programadas={contexto.programadasActivas.map((p) => ({
        id: p.programada.id,
        comercio: p.comercio,
        monto: p.montoHaciaCategoria,
      }))}
      destinos={destinos}
    />
  );
}
