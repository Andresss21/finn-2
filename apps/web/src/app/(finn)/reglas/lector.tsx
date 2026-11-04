// Lector de `/reglas` (05 §4.1): llama a `reglas()` y pasa el DTO a la pantalla. Lo único que traduce los errores de la
// consulta es `consultar()` (CP-13).
import { reglas } from '@finn/aplicacion/consultas/reglas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { PantallaReglas } from './pantalla';

export async function LectorReglas() {
  const dto = await consultar(async () => reglas(await depsDeConsulta()));
  return <PantallaReglas dto={dto} />;
}
