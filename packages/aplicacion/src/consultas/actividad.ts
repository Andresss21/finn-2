// `consultas.actividad({ texto?, montos?, categoriaId?, cuentaId?, fechas?, estado?, tipo?, origen?, cursor?, limite? })`
// (04 §6.7.1): los filtros se aplican sobre los hechos; el texto se resuelve con `comercio`/`nota ILIKE` en la misma
// instantánea y el resultado filtra los hechos.
import { actividad as actividadDelDominio } from '@finn/dominio/selectores';
import { idsDeTransaccionesPorTexto } from '@finn/db';
import { parametrosActividad } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';
import { sinIndefinidos } from './sin-indefinidos.ts';

export type ActividadDto = Encabezado & ReturnType<typeof actividadDelDominio>;

export function actividad(d: DepsConsulta, parametros: unknown = {}): Promise<ActividadDto> {
  return consultar(
    d,
    { nombre: 'actividad', contrato: parametrosActividad, parametros },
    async ({ tx, i, encabezado }, { texto, ...filtros }) => ({
      ...encabezado,
      ...actividadDelDominio(i, {
        ...sinIndefinidos(filtros),
        ...(texto === undefined ? {} : { idsDeTexto: await idsDeTransaccionesPorTexto(tx, texto) }),
      }),
    }),
  );
}
