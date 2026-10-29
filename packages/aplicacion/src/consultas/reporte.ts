// `consultas.reporte({ tipo, ... })` (04 §6.9, BE-40): un tipo por llamada, con el encabezado común. Cada tipo es un
// selector puro del dominio (inv. 27); la consulta solo despacha. Por ahora `ritmo` (6.9.7); la ola 2 suma el resto.
import type { Instantanea } from '@finn/dominio';
import { ritmo, type RitmoSel } from '@finn/dominio/selectores';
import { parametrosReporte } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

/** El cuerpo de cada tipo: lo que devuelve su selector. */
interface Cuerpos {
  readonly ritmo: RitmoSel;
}

/** El despacho por tipo: un selector del dominio por cada uno (la ola 2 suma los demás). */
const selectores: { readonly [T in keyof Cuerpos]: (i: Instantanea) => Cuerpos[T] } = { ritmo };

export type ReporteDto = Encabezado & Cuerpos[keyof Cuerpos];
export type ReporteDe<T extends keyof Cuerpos> = Encabezado & Cuerpos[T];

/** Con el tipo conocido en el tipo de TypeScript, el DTO es el de ese tipo. */
export function reporte<P extends { readonly tipo: keyof Cuerpos }>(
  d: DepsConsulta,
  parametros: P,
): Promise<ReporteDe<P['tipo']>>;
export function reporte(d: DepsConsulta, parametros: unknown): Promise<ReporteDto>;
export function reporte(d: DepsConsulta, parametros: unknown): Promise<ReporteDto> {
  return consultar(
    d,
    { nombre: 'reporte', contrato: parametrosReporte, parametros },
    ({ i, encabezado }, p): ReporteDto => ({ ...encabezado, ...selectores[p.tipo](i) }),
  );
}
