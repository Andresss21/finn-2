// `consultas.programadas({ horizonteDias? })` (04 §6.12.1, BE-37, CF-20): las programadas y los próximos pagos a 30 días
// por defecto, contados desde el "hoy" de la base. `calendarioEditable` y `puedeEliminar` leen las referencias [H]/[I]
// (movimientos y SMS) en la misma instantánea.
import {
  programadas as programadasDelDominio,
  type ProgramadasSel,
} from '@finn/dominio/selectores';
import { leerReferenciasDeProgramadas } from '@finn/db';
import { parametrosProgramadas } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type ProgramadasDto = Encabezado & ProgramadasSel;

export function programadas(d: DepsConsulta, parametros?: unknown): Promise<ProgramadasDto> {
  return consultar(
    d,
    { nombre: 'programadas', contrato: parametrosProgramadas.default({}), parametros },
    async ({ tx, i, encabezado }, p) => ({
      ...encabezado,
      ...programadasDelDominio(i, await leerReferenciasDeProgramadas(tx), p.horizonteDias),
    }),
  );
}
