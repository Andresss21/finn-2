// Lector de `/reportes/[tipo]` (05 §4.1): llama a `reporte()` con la ventana de la URL y pasa el DTO a la pantalla. Una ventana que la
// consulta rechaza llega como `VALIDACION` y `consultar()` redirige a la misma ruta sin ella (05 §2.2, CP-13).
import { reporte } from '@finn/aplicacion/consultas/reporte';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../../servidor/parametros';
import { PantallaReporte } from './pantalla';
import { TIPOS, type TipoDeUrl } from './tipos';

export async function LectorReporte({
  url,
  busqueda,
}: {
  readonly url: TipoDeUrl;
  readonly busqueda: BusquedaDePagina;
}) {
  const { ventana } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    reporte(await depsDeConsulta(), {
      tipo: TIPOS[url],
      ...(ventana === undefined ? {} : { ventana }),
    }),
  );
  return (
    <PantallaReporte url={url} dto={dto} {...(typeof ventana === 'string' ? { ventana } : {})} />
  );
}
