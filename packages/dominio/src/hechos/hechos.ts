// `Hechos` y `Instantanea` (04 §2.4). Los hechos son las 18 tablas [M] que el motor carga (04 §5.2).
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
 * Estado derivado de unos `Hechos` y un `hoy` (04 §5.3). Aquí solo se fija su base; los valores
 * derivados (saldos, Disponible, LPA…) los agregan las tareas del motor que los calculan.
 */
export interface Instantanea {
  readonly hechos: Hechos;
  readonly hoy: FechaLocal;
}
