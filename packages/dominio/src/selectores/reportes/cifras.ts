// [CH-251] La cifra principal de los reportes por período (E5-5 de la entrega 4, 04 §6.9.2): el último período de la
// ventana, con su fin y su estado, y el resumen de Cumplimiento. La pantalla solo los formatea (PF-3).
import { Centavos } from '../../valores/centavos';
import type { Instantanea } from '../../hechos';
import { type PeriodoDto, periodoDto } from '../comunes';
import { type FiltroDeReporte, periodosDeVentana, type Ventana } from './comunes';
import { cumplimiento } from './cumplimiento';

/** El último período de W (`cerrado` con `ultimos_n`, `activo` con `actual`); ninguno si W está vacía. */
export function ultimoPeriodo(i: Instantanea, ventana?: Ventana): PeriodoDto | undefined {
  const p = periodosDeVentana(i, ventana).at(-1);
  return p === undefined ? undefined : periodoDto(i, p);
}

export interface ResumenDeCumplimiento {
  readonly periodo: PeriodoDto;
  /** Categorías con Gastado > máx(Asig, 0): una desasignación sin gasto no se pasa. */
  readonly sePasaron: number;
  /** Las filas de ese período (las categorías que existían en él). */
  readonly categorias: number;
}

/** «k de n» del último período de W; ninguno si W está vacía. */
export function resumenCumplimiento(
  i: Instantanea,
  filtro: FiltroDeReporte = {},
): ResumenDeCumplimiento | undefined {
  const periodo = ultimoPeriodo(i, filtro.ventana);
  if (periodo === undefined) return undefined;
  const filas = cumplimiento(i, filtro).filter((x) => x.periodo === periodo.inicio);
  return {
    periodo,
    sePasaron: filas.filter((x) => x.gastado > Centavos.max(x.asignado, Centavos.cero)).length,
    categorias: filas.length,
  };
}
