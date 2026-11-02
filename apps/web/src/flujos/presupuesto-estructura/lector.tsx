// Lector de `/presupuesto/estructura` y de sus flujos (05 §4.1): llama a `estructura()` y pasa el árbol a la lista o al
// formulario. Lo único que traduce los errores de la consulta es `consultar()` (CP-13). El motivo de "Eliminar" deshabilitado
// es el mensaje de `categoria_con_historial` del catálogo del servidor (04 §7.5), no un texto repetido en la interfaz.
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import { estructura } from '@finn/aplicacion/consultas/estructura';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioEstructura, type ModoEstructura } from './formulario';
import { ListaEstructura } from './lista';

export interface PropsLectorEstructura {
  readonly modo: 'lista' | ModoEstructura;
  readonly id?: string;
  /** `?grupo=` de la nueva categoría. */
  readonly grupo?: string;
  readonly superpuesto?: boolean;
}

export async function LectorEstructura({
  modo,
  id,
  grupo,
  superpuesto = false,
}: PropsLectorEstructura) {
  const { grupos } = await consultar(async () => estructura(await depsDeConsulta()));
  if (modo === 'lista') return <ListaEstructura grupos={grupos} />;
  const fila = grupos.flatMap((g) => g.categorias).find((c) => c.categoria.id === id);
  const motivoHistorial =
    fila === undefined || fila.puedeEliminar
      ? undefined
      : (mensajeDeRechazo({
          codigo: 'categoria_con_historial',
          datos: { categoria: fila.categoria.nombre },
        }) ?? undefined);
  return (
    <FormularioEstructura
      modo={modo}
      grupos={grupos}
      superpuesto={superpuesto}
      {...(id === undefined ? {} : { id })}
      {...(grupo === undefined ? {} : { grupoInicial: grupo })}
      {...(motivoHistorial === undefined ? {} : { motivoHistorial })}
    />
  );
}
