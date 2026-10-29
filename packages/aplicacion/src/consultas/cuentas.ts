// `consultas.cuentas({ incluirArchivadas? })` (04 §6.5): `seleccionar.cuentas` con las instituciones [M] y el encabezado.
import { cuentas as cuentasDelDominio } from '@finn/dominio/selectores';
import { leerInstituciones } from '@finn/db';
import { parametrosCuentas } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type CuentasDto = Encabezado & ReturnType<typeof cuentasDelDominio>;

export function cuentas(d: DepsConsulta, parametros: unknown = {}): Promise<CuentasDto> {
  return consultar(
    d,
    { nombre: 'cuentas', contrato: parametrosCuentas, parametros },
    async ({ tx, i, encabezado }, p) => ({
      ...encabezado,
      ...cuentasDelDominio(i, {
        instituciones: await leerInstituciones(tx),
        ...(p.incluirArchivadas === undefined ? {} : { incluirArchivadas: p.incluirArchivadas }),
      }),
    }),
  );
}
