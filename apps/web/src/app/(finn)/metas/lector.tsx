// Lector de `/metas` (05 §4.1): llama a `metas()` y pasa el DTO a la pantalla. Lo único que traduce los errores de la consulta
// es `consultar()` (CP-13).
import { metas } from '@finn/aplicacion/consultas/metas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { leerResultadoMeta } from '../../../flujos/metas-meta/resultado';
import { PantallaMetas } from './pantalla';

/** `resultado` es `?resultado=` (E4-18): de la interfaz, no llega a la consulta; se valida en `leerResultadoMeta`. */
export async function LectorMetas({ resultado }: { readonly resultado?: string | undefined } = {}) {
  const dto = await consultar(async () => metas(await depsDeConsulta()));
  return <PantallaMetas dto={dto} resultado={leerResultadoMeta(resultado)} />;
}
