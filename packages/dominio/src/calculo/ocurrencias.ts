// Ocurrencias de transacciones programadas (01 §4.16; P17, M2, A-6). La existencia de una ocurrencia
// es derivada; su resolución (emparejada, registrada u omitida) es un hecho. La reactivación de
// CF-20 llega con TA-139: aquí una programada inactiva no genera ninguna ocurrencia.
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

/** Las fechas de las ocurrencias ≤ hasta, solo si está activa y hasta su fecha de fin. */
export function ocurrencias(
  p: ReglaDeOcurrencia & Pick<Programada, 'fechaFin' | 'activa'>,
  hasta: FechaLocal,
): FechaLocal[] {
  if (!p.activa) return [];
  const tope = p.fechaFin !== null && p.fechaFin < hasta ? p.fechaFin : hasta;
  const fechas: FechaLocal[] = [];
  for (let k = 0, f = p.primeraFecha; f <= tope; k += 1, f = fechaDeOcurrencia(p, k))
    fechas.push(f);
  return fechas;
}

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
    .sort((a, b) =>
      a.fecha !== b.fecha
        ? FechaLocal.comparar(a.fecha, b.fecha)
        : a.programadaId < b.programadaId
          ? -1
          : a.programadaId > b.programadaId
            ? 1
            : 0,
    );
}
