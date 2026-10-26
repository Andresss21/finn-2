// Reporte `hallazgos` (06 §3.5.11, FD-17, CF-04): junta los hallazgos de ritmo, tarjetas, realidad,
// suscripciones, hormiga y comparación con el promedio del período activo. No repite la lógica de
// cada uno: llama a sus selectores y solo ordena, deduplica por clave y recorta.
import type { Instantanea, ReglaComercio } from '../../hechos';
import { type PeriodoDto, periodoDto } from '../comunes';
import { type HallazgoDeHormiga, hormiga } from './hormiga';
import { type HallazgoDePromedio, type HallazgoDeRealidad, realidad } from './realidad';
import { type HallazgoDeRitmo, ritmo } from './ritmo';
import { type HallazgoDeSuscripcion, suscripciones } from './suscripciones';
import { type HallazgoDeTarjeta, tarjetas } from './tarjetas';
import { HALLAZGOS_MAX } from './umbrales';

export type Hallazgo =
  | HallazgoDeRitmo
  | HallazgoDeTarjeta
  | HallazgoDeRealidad
  | HallazgoDeSuscripcion
  | HallazgoDeHormiga
  | HallazgoDePromedio;

/** Orden de tipo para desempatar: ritmo, tarjeta, realidad, suscripción, hormiga, promedio. */
export const ORDEN_DE_TIPO: Record<Hallazgo['tipo'], number> = {
  ritmo: 0,
  tarjeta: 1,
  realidad: 2,
  suscripcion: 3,
  hormiga: 4,
  promedio: 5,
};

export interface HallazgosSel {
  readonly periodo: PeriodoDto;
  /** Vacío: la pantalla muestra "Todo en orden". */
  readonly hallazgos: readonly Hallazgo[];
}

type Ordenable = Pick<Hallazgo, 'tipo' | 'clave' | 'impacto'>;

const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Una fila por clave (la de mayor impacto; a igual impacto, la de menor orden de tipo), por impacto
 * descendente, después orden de tipo y después clave; como máximo `HALLAZGOS_MAX`.
 */
export function ordenarHallazgos<T extends Ordenable>(
  hs: readonly T[],
  maximo = HALLAZGOS_MAX,
): T[] {
  const orden = (x: T) => ORDEN_DE_TIPO[x.tipo];
  const mejor = new Map<string, T>();
  for (const h of hs) {
    const otro = mejor.get(h.clave);
    if (
      otro === undefined ||
      h.impacto > otro.impacto ||
      (h.impacto === otro.impacto && orden(h) < orden(otro))
    )
      mejor.set(h.clave, h);
  }
  return [...mejor.values()]
    .sort((x, y) => y.impacto - x.impacto || orden(x) - orden(y) || menor(x.clave, y.clave))
    .slice(0, maximo);
}

export function hallazgos(
  i: Instantanea,
  reglas: readonly Pick<ReglaComercio, 'patron'>[],
): HallazgosSel {
  const r = realidad(i);
  return {
    periodo: periodoDto(i, i.presupuesto.activo),
    hallazgos: ordenarHallazgos<Hallazgo>([
      ...ritmo(i).hallazgos,
      ...tarjetas(i).hallazgos,
      ...r.hallazgos,
      ...suscripciones(i, reglas).hallazgos,
      ...hormiga(i, reglas).hallazgos,
    ]),
  };
}
