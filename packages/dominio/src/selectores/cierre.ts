// El último período cerrado para el push de cierre (04 §10.2 paso 3, P4-2, BE-51): la reducción de LPA aplicada al cierre
// (Σ SobD(c, p) + Σ E(t, p), §4.6–§4.7, con `reduccionDe`) y las metas que vencieron en ese período (AV-17).
import { avisosDeEstado } from '../avisos/estado';
import { reduccionDe } from '../calculo/disponible';
import type { Instantanea } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';

export interface UltimoCierre {
  readonly inicio: FechaLocal;
  readonly fin: FechaLocal;
  readonly reduccion: Centavos;
  readonly metasVencidas: number;
  /** Los inicios de los períodos cerrados anteriores, del más reciente al más antiguo. */
  readonly anteriores: readonly FechaLocal[];
}

export function ultimoCierre(i: Instantanea): UltimoCierre | null {
  const cerrados = i.historialLpa.map((h) => h.periodo);
  const p = cerrados.at(-1);
  if (p === undefined) return null;
  return {
    inicio: p.inicio,
    fin: p.fin,
    reduccion: i.presupuesto.celdas
      .filter((x) => x.periodo.inicio === p.inicio)
      .map(reduccionDe)
      .reduce(Centavos.sumar, Centavos.cero),
    metasVencidas: avisosDeEstado(i).filter((a) => {
      const f = a.datos['fechaObjetivo'] as FechaLocal | undefined;
      return a.aviso === 'AV-17' && f !== undefined && f >= p.inicio && f <= p.fin;
    }).length,
    anteriores: cerrados
      .slice(0, -1)
      .map((x) => x.inicio)
      .reverse(),
  };
}
