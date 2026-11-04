// Lector de `/notificaciones` (05 §4.1, FE-32): llama a `notificaciones()` con `?no-leidas=` y `?cursor=` (05 §2.2) y pasa el DTO al
// centro, como página completa o, con `superpuesto`, como el panel que cae desde la campana (CF-23). Lo único que traduce los
// errores de la consulta es `consultar()` (CP-13).
import { notificaciones } from '@finn/aplicacion/consultas/notificaciones';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { SuperpuestoDeRuta } from '../../../componentes/navegacion/flujo-de-ruta';
import { marcarLeidas } from '../../../servidor/acciones/notificaciones';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../servidor/parametros';
import { notificaciones as t } from '../../../textos/notificaciones';
import { ContenidoNotificaciones } from './contenido';
import { PantallaNotificaciones } from './pantalla';

export async function LectorNotificaciones({
  busqueda,
  superpuesto = false,
}: {
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  const parametros = aParametrosDeConsulta({
    'no-leidas': busqueda['no-leidas'],
    cursor: busqueda['cursor'],
  });
  const dto = await consultar(async () => notificaciones(await depsDeConsulta(), parametros));
  const soloNoLeidas = parametros['soloNoLeidas'] === true;
  const cursor = typeof parametros['cursor'] === 'string' ? parametros['cursor'] : undefined;
  const comun = {
    dto,
    soloNoLeidas,
    marcarLeidas,
    ...(cursor === undefined ? {} : { cursor }),
  };
  if (!superpuesto) return <PantallaNotificaciones {...comun} />;
  return (
    <SuperpuestoDeRuta titulo={t.titulo} desde="arriba">
      <PublicarEncabezado encabezado={dto} />
      <ContenidoNotificaciones {...comun} />
    </SuperpuestoDeRuta>
  );
}
