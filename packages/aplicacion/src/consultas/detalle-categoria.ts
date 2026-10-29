// `consultas.detalleCategoria({ categoriaId, periodoInicio? })` (04 §6.3): el detalle de una categoría normal o de
// pago sale de los selectores del dominio; la consulta resuelve la clase, lee las reglas [H] y agrega el encabezado.
import {
  detalleCategoria as detalleNormal,
  detallePagoTarjeta,
  type DetalleCategoria,
  type DetallePagoTarjeta,
} from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import { parametrosDetalleCategoria } from '../contratos/consultas.ts';
import { ExcepcionFinn, MENSAJE_VALIDACION, mensajeDeRechazo } from '../errores/index.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type DetalleCategoriaDto = Encabezado & (DetalleCategoria | DetallePagoTarjeta);

export function detalleCategoria(
  d: DepsConsulta,
  parametros: unknown,
): Promise<DetalleCategoriaDto> {
  return consultar(
    d,
    { nombre: 'detalleCategoria', contrato: parametrosDetalleCategoria, parametros },
    async ({ tx, i, encabezado }, p) => {
      const categoria = i.hechos.categorias.find((c) => c.id === p.categoriaId);
      if (categoria === undefined)
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
      const opciones = p.periodoInicio === undefined ? {} : { periodoInicio: p.periodoInicio };
      if (categoria.clase === 'pago')
        return { ...encabezado, ...detallePagoTarjeta(i, categoria.id, opciones) };
      const reglas = await leerReglasComercio(tx);
      return { ...encabezado, ...detalleNormal(i, categoria.id, { ...opciones, reglas }) };
    },
  );
}
