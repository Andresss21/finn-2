// Prototipo de la agenda de la medianoche (05 §6.6, FE-20).
// El "hoy" lo da el servidor (Encabezado.hoy). El reloj del dispositivo solo se usa para
// medir cuánto falta; nunca para decidir qué día es.
// El Salvador: UTC−6 sin horario de verano (00 P18). 00:00 local = 06:00 UTC.
const DESFASE_UTC_HORAS = 6;
const MARGEN_MS = 5_000;           // da tiempo a que finn.hoy() ya devuelva el día nuevo

export function instanteMedianocheSiguiente(hoy: string): number {
  const [a, m, d] = hoy.split('-').map(Number) as [number, number, number];
  return Date.UTC(a, m - 1, d + 1, DESFASE_UTC_HORAS, 0, 0, 0);   // Date.UTC normaliza fin de mes y de año
}

export type Agenda =
  | { accion: 'esperar'; ms: number }
  | { accion: 'refrescar_ya' };     // el dispositivo ya pasó la medianoche del "hoy" del servidor

/**
 * @param hoyServidor   Encabezado.hoy de la última respuesta
 * @param ahora         Date.now() del dispositivo
 * @param yaRefrescadoPara  el valor de hoyServidor con el que ya se hizo un refresco inmediato
 */
export function agendarMedianoche(hoyServidor: string, ahora: number, yaRefrescadoPara: string | null): Agenda {
  const objetivo = instanteMedianocheSiguiente(hoyServidor) + MARGEN_MS;
  const ms = objetivo - ahora;
  if (ms > 0) return { accion: 'esperar', ms: Math.min(ms, 2 ** 31 - 1) };
  // Reloj del dispositivo adelantado, o el servidor todavía no cambió de día:
  // un solo refresco inmediato por cada valor de hoyServidor (evita un bucle).
  if (yaRefrescadoPara === hoyServidor) return { accion: 'esperar', ms: 60_000 };
  return { accion: 'refrescar_ya' };
}
