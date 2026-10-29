// `consultas.porCobrar({ incluirCerrados? })` (04 §6.12.3): el saldo abierto por deudor y el dinero en camino (AV-09).
// Todo sale del selector `porCobrar`; la consulta solo agrega el encabezado común.
import { porCobrar as porCobrarDelDominio, type PorCobrarSel } from '@finn/dominio/selectores';
import { parametrosPorCobrar } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type PorCobrarDto = Encabezado & PorCobrarSel;

export function porCobrar(d: DepsConsulta, parametros?: unknown): Promise<PorCobrarDto> {
  return consultar(
    d,
    { nombre: 'porCobrar', contrato: parametrosPorCobrar.default({}), parametros },
    ({ i, encabezado }, p) => ({
      ...encabezado,
      ...porCobrarDelDominio(
        i,
        p.incluirCerrados === undefined ? {} : { incluirCerrados: p.incluirCerrados },
      ),
    }),
  );
}
