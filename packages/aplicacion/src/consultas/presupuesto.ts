// `consultas.presupuesto({ periodoInicio?, filtro? })` (04 §6.2): `seleccionar.presupuesto` con el encabezado común.
// El filtro de BE-39, los grupos y los totales (CH-32) los resuelve el selector; la consulta no calcula.
import { presupuesto as presupuestoDelDominio } from '@finn/dominio/selectores';
import type { PresupuestoSel } from '@finn/dominio/selectores';
import { parametrosPresupuesto } from '../contratos/consultas.ts';
import { ExcepcionFinn, MENSAJE_VALIDACION } from '../errores/index.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type PresupuestoDto = Encabezado & PresupuestoSel;

export function presupuesto(d: DepsConsulta, parametros: unknown = {}): Promise<PresupuestoDto> {
  return consultar(
    d,
    { nombre: 'presupuesto', contrato: parametrosPresupuesto, parametros },
    ({ i, encabezado }, p) => {
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
      return { ...encabezado, ...presupuestoDelDominio(i, p.periodoInicio, p.filtro) };
    },
  );
}
