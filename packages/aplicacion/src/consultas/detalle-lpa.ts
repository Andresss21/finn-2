// `consultas.detalleLpa({ periodos? })` (04 §6.4): la descomposición de §4.9, la reducción proyectada y el historial
// salen de `seleccionar.detalleLpa`; la consulta solo agrega el encabezado común.
import { detalleLpa as detalleLpaDelDominio } from '@finn/dominio/selectores';
import type { DetalleLpaSel } from '@finn/dominio/selectores';
import { parametrosDetalleLpa } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type DetalleLpaDto = Encabezado & DetalleLpaSel;

export function detalleLpa(d: DepsConsulta, parametros: unknown = {}): Promise<DetalleLpaDto> {
  return consultar(
    d,
    { nombre: 'detalleLpa', contrato: parametrosDetalleLpa, parametros },
    ({ i, encabezado }, p) => ({ ...encabezado, ...detalleLpaDelDominio(i, p.periodos) }),
  );
}
