// Lector de `/actividad/[transaccionId]` (05 §4.1): llama a `detalleTransaccion()` con el id de la ruta. Un id que no es UUID es
// `notFound()` (7.3). Lo único que traduce los errores es `consultar()` (CP-13).
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { detalleTransaccion } from '@finn/aplicacion/consultas/detalle-transaccion';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { PantallaDetalleTransaccion } from './pantalla';

export async function LectorDetalleTransaccion({
  transaccionId,
  volver,
}: {
  readonly transaccionId: string;
  readonly volver: string | undefined;
}) {
  const dto = await consultar(
    async () => detalleTransaccion(await depsDeConsulta(), { transaccionId }),
    { validacionDeSegmento: true },
  );
  return (
    <PantallaDetalleTransaccion
      dto={dto}
      volver={volver === undefined ? undefined : rutaInterna(volver)}
    />
  );
}
