// Lector de `/ajustes/exportar` (05 §4.1): `ajustes()` (04 §6.11) trae las rutas de descarga (`exportaciones`).
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { DescargasExportar } from './descargas';

export async function LectorExportar() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return <DescargasExportar exportaciones={dto.exportaciones} />;
}
