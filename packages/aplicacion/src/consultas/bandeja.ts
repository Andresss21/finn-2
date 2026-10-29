// `consultas.bandeja({ vista?, cursor? })` (04 §6.8): los movimientos de [H] e [I] se leen en la misma instantánea de
// `leer()` y el selector `bandeja` arma el DTO (aprobación posible, elegibles de "aprobar todos", destinos de
// arrastre). La consulta no calcula nada (inv. 27).
import { bandeja as bandejaDelDominio, type OpcionesDeBandeja } from '@finn/dominio/selectores';
import { leerDatosDeBandeja } from '@finn/db';
import { parametrosBandeja } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export type BandejaDto = Encabezado & ReturnType<typeof bandejaDelDominio>;

export function bandeja(d: DepsConsulta, parametros?: unknown): Promise<BandejaDto> {
  return consultar(
    d,
    { nombre: 'bandeja', contrato: parametrosBandeja.default({}), parametros },
    async ({ tx, i, encabezado }, p) => {
      const opciones: OpcionesDeBandeja = {
        ...(p.vista === undefined ? {} : { vista: p.vista }),
        ...(p.cursor === undefined ? {} : { cursor: p.cursor }),
      };
      return { ...encabezado, ...bandejaDelDominio(i, await leerDatosDeBandeja(tx), opciones) };
    },
  );
}
