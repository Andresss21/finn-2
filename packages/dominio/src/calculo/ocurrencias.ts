// Ocurrencias de las transacciones programadas (01 §4.16; P17, M2, A-6). Que una ocurrencia exista
// es derivado; su resolución (emparejada, registrada u omitida) es un hecho. Una programada inactiva
// no genera ninguna; reactivada, solo las de fecha ≥ `reactivadaDesde` (CF-20).
import type { Hechos, Programada, Uuid } from '../hechos';
import { FechaLocal } from '../valores/fecha-local';

export type ReglaDeOcurrencia = Pick<Programada, 'frecuencia' | 'frecuenciaDias' | 'primeraFecha'>;

export interface OcurrenciaPendiente {
  readonly programadaId: Uuid;
  readonly fecha: FechaLocal;
  /** Fecha < hoy [A-6]. */
  readonly atrasada: boolean;
}

/** Intervalo en días de las frecuencias por días; `null` en la mensual y la anual. */
function intervalo(p: ReglaDeOcurrencia): number | null {
  if (p.frecuencia === 'semanal') return 7;
  if (p.frecuencia === 'quincenal') return 14;
  if (p.frecuencia !== 'cada_n_dias') return null;
  const n = p.frecuenciaDias;
  if (n === null || !Number.isInteger(n) || n < 1)
    throw new RangeError(`frecuencia cada N días sin un N válido: ${n}`);
  return n;
}

/**
 * Ocurrencia k (k ≥ 0): primera fecha + k × intervalo en las frecuencias por días; en la mensual
 * y la anual, el mismo día de la primera fecha, recortado al último día del mes si hace falta.
 */
export function fechaDeOcurrencia(p: ReglaDeOcurrencia, k: number): FechaLocal {
  const dias = intervalo(p);
  if (dias !== null) return FechaLocal.sumarDias(p.primeraFecha, k * dias);
  return p.frecuencia === 'mensual'
    ? FechaLocal.sumarMeses(p.primeraFecha, k)
    : FechaLocal.sumarAnios(p.primeraFecha, k);
}

/**
 * Las fechas de las ocurrencias ≤ hasta, solo si está activa, hasta su fecha de fin y, si se
 * reactivó, desde esa fecha (CF-20: las del tramo inactivo no se generan).
 */
export function ocurrencias(
  p: ReglaDeOcurrencia & Pick<Programada, 'fechaFin' | 'activa' | 'reactivadaDesde'>,
  hasta: FechaLocal,
): FechaLocal[] {
  if (!p.activa) return [];
  const tope = p.fechaFin !== null && p.fechaFin < hasta ? p.fechaFin : hasta;
  const desde = p.reactivadaDesde;
  const fechas: FechaLocal[] = [];
  for (let k = 0, f = p.primeraFecha; f <= tope; k += 1, f = fechaDeOcurrencia(p, k))
    if (desde === null || !(f < desde)) fechas.push(f);
  return fechas;
}

/** `fecha` es una ocurrencia que la programada genera en su estado actual (§4.16, CF-20). */
export const esOcurrencia = (p: Programada, fecha: FechaLocal): boolean =>
  ocurrencias(p, fecha).at(-1) === fecha;

/** Fecha y programada: una sola ocurrencia por par, así que dos claves nunca son iguales. */
const clave = (x: OcurrenciaPendiente) => `${x.fecha}|${x.programadaId}`;

/**
 * Pendientes: las ocurrencias sin resolución con fecha ≤ hoy + horizonte (en días: 7 en Inicio y
 * 30 en Programadas, BE-37), en orden de fecha y, a igual fecha, de programada.
 */
export function pendientes(
  h: Pick<Hechos, 'programadas' | 'ocurrencias_resueltas'>,
  hoy: FechaLocal,
  horizonteDias: number,
): OcurrenciaPendiente[] {
  const resueltas = new Set(
    h.ocurrencias_resueltas.map((r) => `${r.programadaId}|${r.fechaEsperada}`),
  );
  const hasta = FechaLocal.sumarDias(hoy, horizonteDias);
  return h.programadas
    .flatMap((p) =>
      ocurrencias(p, hasta)
        .filter((fecha) => !resueltas.has(`${p.id}|${fecha}`))
        .map((fecha) => ({ programadaId: p.id, fecha, atrasada: fecha < hoy })),
    )
    .sort((a, b) => (clave(a) < clave(b) ? -1 : 1));
}
