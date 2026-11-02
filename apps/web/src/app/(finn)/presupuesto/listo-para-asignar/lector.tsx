// Lector de `/presupuesto/listo-para-asignar` (05 §4.1): llama a `detalleLpa({ periodos })` con `?historial=`. La URL trae
// texto: un entero se convierte acá; cualquier otro valor llega tal cual y el contrato lo rechaza como `VALIDACION`, con lo
// que `consultar()` redirige a la misma ruta sin el parámetro (05 §2.2, fuera de 1 a 60).
import { detalleLpa } from '@finn/aplicacion/consultas/detalle-lpa';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../../servidor/parametros';
import { PantallaListoParaAsignar } from './pantalla';

export async function LectorListoParaAsignar({
  busqueda,
}: {
  readonly busqueda: BusquedaDePagina;
}) {
  const { periodos, ...resto } = aParametrosDeConsulta(busqueda);
  const parametros =
    typeof periodos === 'string' && /^[0-9]+$/.test(periodos)
      ? { ...resto, periodos: Number(periodos) }
      : { ...resto, ...(periodos === undefined ? {} : { periodos }) };
  const dto = await consultar(async () => detalleLpa(await depsDeConsulta(), parametros));
  return <PantallaListoParaAsignar dto={dto} />;
}
