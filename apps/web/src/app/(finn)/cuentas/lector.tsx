// Lector de `/cuentas` (05 §4.1): llama a `cuentas({ incluirArchivadas })` con el `?archivadas=1` de la URL y pasa el DTO a la
// pantalla. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../servidor/parametros';
import { PantallaCuentas } from './pantalla';

export async function LectorCuentas({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const parametros = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () => cuentas(await depsDeConsulta(), parametros));
  return <PantallaCuentas dto={dto} />;
}
