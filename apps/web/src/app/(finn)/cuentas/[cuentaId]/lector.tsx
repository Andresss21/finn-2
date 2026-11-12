// Lector de `/cuentas/[cuentaId]` (05 §4.1): llama a `detalleCuenta()` con el id de la ruta y los filtros de la URL. Un id que no es
// UUID es `notFound()` (7.3, `validacionDeSegmento`). Lo único que traduce los errores es `consultar()` (CP-13).
import { detalleCuenta } from '@finn/aplicacion/consultas/detalle-cuenta';
import { archivarCuenta, desarchivarCuenta } from '../../../../servidor/acciones/cuentas';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../../servidor/parametros';
import { leerResultado, PARAMETRO_RESULTADO } from '../../../../flujos/cuentas-resultado';
import { PantallaDetalleCuenta } from './pantalla';

const texto = (v: BusquedaDePagina[string]): string | undefined =>
  typeof v === 'string' && v !== '' ? v : undefined;

export async function LectorDetalleCuenta({
  cuentaId,
  busqueda,
}: {
  readonly cuentaId: string;
  readonly busqueda: BusquedaDePagina;
}) {
  // `?resultado=` es de la interfaz (E2-13): no llega a la consulta.
  const { [PARAMETRO_RESULTADO]: aviso, ...paraLaConsulta } = busqueda;
  const parametros = { ...aParametrosDeConsulta(paraLaConsulta), cuentaId };
  const dto = await consultar(async () => detalleCuenta(await depsDeConsulta(), parametros), {
    validacionDeSegmento: true,
  });
  return (
    <PantallaDetalleCuenta
      dto={dto}
      filtros={{
        periodo: texto(busqueda['periodo']),
        tipo: texto(busqueda['tipo']),
        estado: texto(busqueda['estado']),
        cursor: texto(busqueda['cursor']),
      }}
      resultado={leerResultado(texto(aviso))}
      desarchivar={desarchivarCuenta}
      archivar={archivarCuenta}
    />
  );
}
