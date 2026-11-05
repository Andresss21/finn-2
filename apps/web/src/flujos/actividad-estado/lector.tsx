// Lector de `/actividad/[transaccionId]/estado` (05 §2.6, §4.1): llama a `detalleTransaccion({ transaccionId })` y pasa al flujo el
// estado bancario que vio la persona (el `esperado` de OP-30). Lo único que traduce los errores es `consultar()`.
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { detalleTransaccion } from '@finn/aplicacion/consultas/detalle-transaccion';
import { cambiarEstadoBancario } from '../../servidor/acciones/transacciones';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { dominio } from '../../textos/dominio';
import { FormularioActividadEstado } from './formulario';

export async function LectorActividadEstado({
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
  const volverA = volver === undefined ? undefined : rutaInterna(volver);
  return (
    <FormularioActividadEstado
      accion={cambiarEstadoBancario}
      transaccionId={transaccionId}
      nombre={dto.transaccion.comercio ?? dominio.sinComercio}
      estadoActual={dto.transaccion.estadoBancario}
      detalle={`/actividad/${transaccionId}${volverA === undefined ? '' : `?volver=${encodeURIComponent(volverA)}`}`}
    />
  );
}
