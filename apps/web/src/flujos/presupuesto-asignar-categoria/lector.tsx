// Lector de `/presupuesto/asignar/[categoriaId]` (05 §4.1): llama a `formulario({ operacion: 'asignar' })` con el `?periodo=` de la
// URL y pasa el DTO al formulario. Un período cerrado no se abre: redirige al detalle de la categoría con el motivo
// `periodo_cerrado` (05 §2.3). Lo único que traduce los errores de las consultas es `consultar()` (CP-13).
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import type { FechaLocal } from '@finn/dominio/valores';
import { redirect } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { FormularioAsignar } from './formulario';

export interface PropsLectorAsignar {
  readonly categoriaId: string;
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}

export async function LectorAsignar({
  categoriaId,
  busqueda,
  superpuesto = false,
}: PropsLectorAsignar) {
  const { periodoInicio } = aParametrosDeConsulta(busqueda);
  const pedido = typeof periodoInicio === 'string' ? (periodoInicio as FechaLocal) : undefined;
  if (pedido !== undefined) {
    // Un `?periodo=` que no abre un período es `VALIDACION`: `consultar()` redirige a la misma ruta sin él (05 §2.2).
    const vista = await consultar(async () =>
      presupuesto(await depsDeConsulta(), { periodoInicio: pedido }),
    );
    if (vista.periodo.estado === 'cerrado')
      redirect(`/presupuesto/categorias/${categoriaId}?periodo=${pedido}&motivo=periodo_cerrado`);
  }
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), {
        operacion: 'asignar',
        categoriaId,
        ...(pedido === undefined ? {} : { periodoInicio: pedido }),
      }),
    { validacionDeSegmento: true },
  );
  const { contexto } = dto;
  return (
    <FormularioAsignar
      categoriaId={categoriaId}
      categoria={contexto.categoria.nombre}
      archivada={contexto.categoria.archivada === true}
      periodoInicio={contexto.periodo}
      asignado={contexto.asignado}
      disponible={contexto.disponible}
      asignadoEsperado={contexto.asignadoEsperado}
      {...(contexto.meta === undefined ? {} : { meta: contexto.meta })}
      rutaPadre={pedido === undefined ? '/presupuesto' : `/presupuesto?periodo=${pedido}`}
      superpuesto={superpuesto}
    />
  );
}
