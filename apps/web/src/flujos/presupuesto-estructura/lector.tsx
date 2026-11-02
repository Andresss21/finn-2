// Lector de `/presupuesto/estructura` y de sus flujos de alta (05 §4.1): llama a `estructura()` y pasa el árbol a la lista o al
// formulario. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { estructura } from '@finn/aplicacion/consultas/estructura';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioEstructura, type ModoEstructura } from './formulario';
import { ListaEstructura } from './lista';

export interface PropsLectorEstructura {
  readonly modo: 'lista' | ModoEstructura;
  /** `?grupo=` de la nueva categoría. */
  readonly grupo?: string;
  readonly superpuesto?: boolean;
}

export async function LectorEstructura({
  modo,
  grupo,
  superpuesto = false,
}: PropsLectorEstructura) {
  const { grupos } = await consultar(async () => estructura(await depsDeConsulta()));
  if (modo === 'lista') return <ListaEstructura grupos={grupos} />;
  return (
    <FormularioEstructura
      modo={modo}
      grupos={grupos}
      superpuesto={superpuesto}
      {...(grupo === undefined ? {} : { grupoInicial: grupo })}
    />
  );
}
