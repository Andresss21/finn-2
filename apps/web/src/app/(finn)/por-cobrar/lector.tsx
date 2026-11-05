// Lector de `/por-cobrar` (05 §4.1): llama a `porCobrar({ incluirCerrados })` con el `?cerrados=1` de la URL y pasa el DTO a la
// pantalla. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { porCobrar } from '@finn/aplicacion/consultas/por-cobrar';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../servidor/parametros';
import { PantallaPorCobrar } from './pantalla';

export async function LectorPorCobrar({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const parametros = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () => porCobrar(await depsDeConsulta(), parametros));
  return <PantallaPorCobrar dto={dto} cerrados={parametros['incluirCerrados'] === true} />;
}
