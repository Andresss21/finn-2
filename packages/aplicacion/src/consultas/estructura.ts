// `consultas.estructura()` (04 §6.12.4): el árbol de grupos y categorías; `puedeEliminar` usa las reglas [H]
// (`reglas_comercio`) leídas en la misma instantánea. El árbol va bajo `grupos` junto al encabezado común (6.0.2).
import {
  estructura as estructuraDelDominio,
  type GrupoDeEstructura,
} from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type EstructuraDto = Encabezado & { readonly grupos: readonly GrupoDeEstructura[] };

export function estructura(d: DepsConsulta): Promise<EstructuraDto> {
  return consultar(
    d,
    { nombre: 'estructura', contrato: sinParametros, parametros: undefined },
    async ({ tx, i, encabezado }) => ({
      ...encabezado,
      grupos: estructuraDelDominio(i, await leerReglasComercio(tx)),
    }),
  );
}
