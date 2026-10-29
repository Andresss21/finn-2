// `consultas.sugerencia({ comercio })` (04 §6.14.3): la categoría sugerida para un comercio escrito, con el mismo
// criterio de §4.17 que usa la bandeja (regla de comercio y, si no, historial). Las reglas son [H]: se leen en la
// misma instantánea. Es una lectura interactiva (CP-3): sin escrituras.
import { sugerencia as sugerenciaDelDominio, type Sugerencia } from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import { parametrosSugerencia } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type SugerenciaDto = Encabezado & { readonly sugerencia: Sugerencia | null };

export function sugerencia(d: DepsConsulta, parametros: unknown): Promise<SugerenciaDto> {
  return consultar(
    d,
    { nombre: 'sugerencia', contrato: parametrosSugerencia, parametros },
    async ({ tx, i, encabezado }, p) => ({
      ...encabezado,
      sugerencia: sugerenciaDelDominio(i, await leerReglasComercio(tx), p.comercio),
    }),
  );
}
