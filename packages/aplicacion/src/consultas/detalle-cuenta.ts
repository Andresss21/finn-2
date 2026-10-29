// `consultas.detalleCuenta({ cuentaId, periodoInicio?, tipo?, estado?, cursor?, limite? })` (04 §6.6): el selector arma
// movimientos con saldo corrido, conciliaciones, tarjeta, préstamo y acciones; la consulta lee `instituciones` y
// `cambios_posteriores` ([H]) en la misma instantánea.
import { detalleCuenta as detalleDelDominio } from '@finn/dominio/selectores';
import { leerCambiosPosteriores, leerInstituciones } from '@finn/db';
import { parametrosDetalleCuenta } from '../contratos/consultas.ts';
import { ExcepcionFinn, MENSAJE_VALIDACION, mensajeDeRechazo } from '../errores/index.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';
import { sinIndefinidos } from './sin-indefinidos.ts';

export type DetalleCuentaDto = Encabezado & ReturnType<typeof detalleDelDominio>;

export function detalleCuenta(d: DepsConsulta, parametros: unknown): Promise<DetalleCuentaDto> {
  return consultar(
    d,
    { nombre: 'detalleCuenta', contrato: parametrosDetalleCuenta, parametros },
    async ({ tx, i, encabezado }, p) => {
      if (!i.hechos.cuentas.some((k) => k.id === p.cuentaId))
        throw new ExcepcionFinn({
          categoria: 'NO_ENCONTRADO',
          codigo: 'no_encontrado',
          mensaje: mensajeDeRechazo({ codigo: 'no_encontrado' }) ?? 'no_encontrado',
        });
      // Un inicio que no abre un período del rango calculado es un parámetro inválido, no un error interno
      if (
        p.periodoInicio !== undefined &&
        !i.presupuesto.periodos.some((q) => q.inicio === p.periodoInicio)
      )
        throw new ExcepcionFinn({
          categoria: 'VALIDACION',
          codigo: 'validacion',
          mensaje: MENSAJE_VALIDACION,
          campos: { periodoInicio: 'No hay un período que empiece ese día.' },
        });
      const { cuentaId, ...filtros } = p;
      return {
        ...encabezado,
        ...detalleDelDominio(i, cuentaId, {
          ...sinIndefinidos(filtros),
          instituciones: await leerInstituciones(tx),
          cambios: await leerCambiosPosteriores(tx),
        }),
      };
    },
  );
}
