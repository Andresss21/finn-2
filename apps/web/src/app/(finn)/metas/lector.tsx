// Lector de `/metas` (05 §4.1): llama a `metas()` y pasa el DTO a la pantalla. Lo único que traduce los errores de la consulta
// es `consultar()` (CP-13).
import { metas } from '@finn/aplicacion/consultas/metas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { PantallaMetas } from './pantalla';

export async function LectorMetas() {
  const dto = await consultar(async () => metas(await depsDeConsulta()));
  return <PantallaMetas dto={dto} />;
}
