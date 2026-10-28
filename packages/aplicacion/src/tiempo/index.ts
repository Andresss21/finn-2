// `@finn/aplicacion/tiempo` (04 §13.1.3, §14.2; P4-9, BE-57). "Hoy" nunca sale de aquí: su única fuente es
// `finn.hoy()` en la transacción (04 §13.1.1). Este módulo solo convierte un instante en la fecha de El Salvador
// (el único uso de `Intl` para fechas del servidor fuera de los formatos) y comprueba la zona del proceso.
import type { Instante } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';

/** La zona de Finn: El Salvador, UTC−6 todo el año. */
export const ZONA_FINN = 'America/El_Salvador';

// `en-CA` da `AAAA-MM-DD`; `FechaLocal.desdeTexto` lo valida
const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_FINN,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** La fecha local en El Salvador de un instante ISO. Usos: un SMS sin fecha (OP-35, N-02) y el reloj de prueba. */
export const fechaLocalDeInstante = (i: Instante): FechaLocal =>
  FechaLocal.desdeTexto(formato.format(new Date(i)));

/** Las zonas que BE-57 acepta para el proceso. */
export const ZONAS_DEL_PROCESO = ['UTC', 'Etc/UTC'] as const;

/** La zona con la que corre el proceso, según `Intl`. */
export const zonaDelProceso = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * BE-57 (ADR-05): al arrancar, el proceso tiene que correr en UTC. Lanza si no; el arranque registra el motivo y
 * no sigue. El código no depende de la zona del proceso (04 §13.2, §13.6): esta es una barrera más.
 */
export function verificarZonaDelProceso(zona: string = zonaDelProceso()): void {
  if (!(ZONAS_DEL_PROCESO as readonly string[]).includes(zona))
    throw new Error(
      `finn: la zona del proceso es "${zona}" y tiene que ser UTC (BE-57, 04 §14.2). Fijá TZ=UTC.`,
    );
}
