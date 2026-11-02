// Lector de `/presupuesto/categorias/[categoriaId]/sacar` (05 §2.3, §4.1): llama a `formulario({ operacion: 'asignar' })` (con CP-10a:
// el Asignado de la archivada y el de cada destino) y pasa el DTO al formulario. Solo se saca de una archivada con Disponible: si la
// categoría no lo está (o ya no tiene dinero) redirige a su detalle. Lo único que traduce los errores es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import type { Centavos } from '@finn/dominio/valores';
import { redirect } from 'next/navigation';
import { sacarDisponible } from '../../servidor/acciones/categorias';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioSacar } from './formulario';

export interface PropsLectorSacar {
  readonly categoriaId: string;
  readonly superpuesto?: boolean;
}

export async function LectorSacar({ categoriaId, superpuesto = false }: PropsLectorSacar) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'asignar', categoriaId }),
    { validacionDeSegmento: true },
  );
  const { contexto } = dto;
  if (contexto.categoria.archivada !== true || contexto.disponible <= 0)
    redirect(`/presupuesto/categorias/${categoriaId}`);
  const destinos = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias
      .filter((x) => x.categoria.id !== categoriaId)
      .map((x) => ({
        id: x.categoria.id,
        nombre: x.categoria.nombre,
        asignado: x.asignado ?? (0 as Centavos),
        disponible: x.disponible,
      })),
  );
  return (
    <FormularioSacar
      accion={sacarDisponible}
      categoriaId={categoriaId}
      categoria={contexto.categoria.nombre}
      asignado={contexto.asignado}
      disponible={contexto.disponible}
      destinos={destinos}
      rutaPadre="/presupuesto"
      superpuesto={superpuesto}
    />
  );
}
