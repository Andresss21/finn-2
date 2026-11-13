// Lector de `/presupuesto/categorias/[categoriaId]` (05 §4.1): llama a `detalleCategoria()` con el id de la ruta y `?periodo=`.
// Un id que no es UUID es `notFound()` (7.3, `validacionDeSegmento`); un `?periodo=` que no abre un período redirige a la misma
// ruta sin ese parámetro (05 §2.2, CP-13). Lo único que traduce los errores es `consultar()`.
import { detalleCategoria } from '@finn/aplicacion/consultas/detalle-categoria';
import { asignarEnCategoria, moverDinero } from '../../../../../servidor/acciones/presupuesto';
import {
  leerResultadoPresupuesto,
  PARAMETRO_RESULTADO,
} from '../../../../../flujos/presupuesto-asignar-categoria/resultado';
import { desarchivarCategoria, sacarDisponible } from '../../../../../servidor/acciones/categorias';
import { consultar } from '../../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../../../servidor/parametros';
import { PantallaDetalleCategoria } from './pantalla';

export async function LectorDetalleCategoria({
  categoriaId,
  busqueda,
}: {
  readonly categoriaId: string;
  readonly busqueda: BusquedaDePagina;
}) {
  // `?resultado=` es de la interfaz (E2-13): no llega a la consulta.
  const { [PARAMETRO_RESULTADO]: aviso, ...paraLaConsulta } = busqueda;
  const parametros = { ...aParametrosDeConsulta(paraLaConsulta), categoriaId };
  const dto = await consultar(async () => detalleCategoria(await depsDeConsulta(), parametros), {
    validacionDeSegmento: true,
  });
  return (
    <PantallaDetalleCategoria
      dto={dto}
      desarchivar={desarchivarCategoria}
      sacar={sacarDisponible}
      resultado={leerResultadoPresupuesto(typeof aviso === 'string' ? aviso : undefined)}
      asignar={asignarEnCategoria}
      mover={moverDinero}
    />
  );
}
