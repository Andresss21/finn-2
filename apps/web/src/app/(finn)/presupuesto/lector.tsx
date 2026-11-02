// Lector de `/presupuesto` (05 §4.1): llama a `presupuesto({ periodoInicio, filtro })` con la URL y pasa el DTO a la pantalla.
// Un `?periodo=` que no abre un período (o un `?filtro=` desconocido) llega como `VALIDACION`: `consultar()` redirige a la
// misma ruta sin ese parámetro (05 §2.2, CP-13).
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../servidor/parametros';
import { PantallaPresupuesto, type FiltroDeUrl } from './pantalla';

const FILTROS: readonly FiltroDeUrl[] = ['sobregiradas', 'sin-fondos', 'cubiertas'];

export async function LectorPresupuesto({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const parametros = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () => presupuesto(await depsDeConsulta(), parametros));
  const crudo = busqueda['filtro'];
  const filtro = FILTROS.find((f) => f === crudo);
  return <PantallaPresupuesto dto={dto} {...(filtro === undefined ? {} : { filtro })} />;
}
