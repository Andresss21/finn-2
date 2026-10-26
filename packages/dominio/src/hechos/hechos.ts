// `Hechos` y `Instantanea` (04 §2.4). Los hechos son las 18 tablas [M] que el motor carga (04 §5.2).
import type { Derivados } from '../calculo/calcular';
import type { FechaLocal } from '../valores/fecha-local';
import type { FilasPorTabla } from './filas';

/** Tablas [M] (03 §0.4): las que el motor lee para `calcular`. */
export type TablaMotor =
  | 'vigencias_ciclo'
  | 'cuentas'
  | 'tarjetas'
  | 'prestamos'
  | 'inversiones'
  | 'grupos'
  | 'categorias'
  | 'asignaciones'
  | 'deudores'
  | 'transacciones'
  | 'efectos'
  | 'lineas'
  | 'condonaciones'
  | 'metas'
  | 'programadas'
  | 'programada_lineas'
  | 'ocurrencias_resueltas'
  | 'conciliaciones';

/** Estado completo que lee el motor: las filas de cada tabla [M]. Inmutable. */
export type Hechos = { readonly [T in TablaMotor]: readonly FilasPorTabla[T][] };

/**
 * Estado derivado de unos `Hechos` y un `hoy` (04 §5.3): los hechos canónicos, hoy y los derivados
 * que arma `calcular` (calculo/calcular.ts).
 */
export interface Instantanea extends Derivados {
  readonly hechos: Hechos;
  readonly hoy: FechaLocal;
}
