// Lector de `/actividad/[transaccionId]/eliminar` (05 §2.6, §4.1): llama a `detalleTransaccion({ transaccionId })` y pasa al flujo
// lo que dice `restricciones` (OP-29) y los eventos vinculados de cada parte. Lo único que traduce los errores es `consultar()`.
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { detalleTransaccion } from '@finn/aplicacion/consultas/detalle-transaccion';
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import { eliminarTransaccion } from '../../servidor/acciones/transacciones';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { dominio } from '../../textos/dominio';
import { FormularioActividadEliminar } from './formulario';

export async function LectorActividadEliminar({
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
  const r = dto.restricciones;
  const archivada = dto.efectos.find((e) => e.cuenta.archivada === true)?.cuenta.nombre;
  const volverA = volver === undefined ? undefined : rutaInterna(volver);
  const eventos = dto.lineas.flatMap((l) => [
    ...l.cobros.map((e) => ({
      clave: `c${e.transaccionId}`,
      tipo: 'cobro' as const,
      fecha: e.fecha,
      monto: e.monto,
    })),
    ...l.condonaciones.map((e) => ({
      clave: `k${e.id}`,
      tipo: 'condonacion' as const,
      fecha: e.fecha,
      monto: e.monto,
    })),
    ...l.devoluciones.map((e) => ({
      clave: `d${e.transaccionId}`,
      tipo: 'devolucion' as const,
      fecha: e.fecha,
      monto: e.monto,
    })),
  ]);
  return (
    <FormularioActividadEliminar
      accion={eliminarTransaccion}
      transaccionId={transaccionId}
      nombre={dto.transaccion.comercio ?? dominio.sinComercio}
      detalle={`/actividad/${transaccionId}${volverA === undefined ? '' : `?volver=${encodeURIComponent(volverA)}`}`}
      eventos={eventos}
      {...(r.puedeEliminar
        ? {}
        : {
            bloqueo:
              mensajeDeRechazo({
                codigo: 'motivoNoEliminar' in r ? r.motivoNoEliminar : 'transaccion_con_eventos',
                ...(archivada === undefined ? {} : { datos: { cuenta: archivada } }),
              }) ?? '',
          })}
    />
  );
}
