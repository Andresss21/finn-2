// `consultas.metas()` (04 §6.10): `seleccionar.metas` con el encabezado común.
import { metas as metasDelDominio, type Metas } from '@finn/dominio/selectores';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type MetasDto = Encabezado & Metas;

export function metas(d: DepsConsulta): Promise<MetasDto> {
  return consultar(
    d,
    { nombre: 'metas', contrato: sinParametros, parametros: undefined },
    ({ i, encabezado }) => ({ ...encabezado, ...metasDelDominio(i) }),
  );
}
