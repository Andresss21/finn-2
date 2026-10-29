// `consultas.detalleTransaccion({ transaccionId })` (04 §6.7.2): el selector arma efectos, líneas con sus eventos y
// restricciones; la consulta aporta lo [H] e [I]: `cambios_posteriores`, el SMS de origen y `monto_original`.
import { detalleTransaccion as detalleDelDominio } from '@finn/dominio/selectores';
import { leerCambiosPosteriores, montoOriginalDe, smsDeTransaccion } from '@finn/db';
import { parametrosDetalleTransaccion } from '../contratos/consultas.ts';
import { ExcepcionFinn, mensajeDeRechazo } from '../errores/index.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type DetalleTransaccionDto = Encabezado &
  Omit<ReturnType<typeof detalleDelDominio>, 'esperado'> & {
    readonly esperado: Record<string, unknown>;
  };

export function detalleTransaccion(
  d: DepsConsulta,
  parametros: unknown,
): Promise<DetalleTransaccionDto> {
  return consultar(
    d,
    { nombre: 'detalleTransaccion', contrato: parametrosDetalleTransaccion, parametros },
    async ({ tx, i, encabezado }, { transaccionId }) => {
      if (!i.hechos.transacciones.some((t) => t.id === transaccionId))
        throw new ExcepcionFinn({
          categoria: 'NO_ENCONTRADO',
          codigo: 'no_encontrado',
          mensaje: mensajeDeRechazo({ codigo: 'no_encontrado' }) ?? 'no_encontrado',
        });
      const sms = await smsDeTransaccion(tx, transaccionId);
      const montoOriginal = await montoOriginalDe(tx, transaccionId);
      const dto = detalleDelDominio(i, transaccionId, {
        cambios: await leerCambiosPosteriores(tx),
        ...(sms === null ? {} : { sms: new Map([[transaccionId, sms]]) }),
      });
      // `monto_original` no está en los hechos del motor (5.2): se completa aquí, solo para mostrar
      return {
        ...encabezado,
        ...dto,
        transaccion:
          montoOriginal === null
            ? dto.transaccion
            : { ...dto.transaccion, montoOriginal: montoOriginal as never },
        esperado:
          montoOriginal === null
            ? dto.esperado
            : { ...dto.esperado, montoOriginal: montoOriginal as never },
      };
    },
  );
}
