// Fechas `AAAA-MM-DD` con el mes abreviado (05 §5.4). Sin `Date` ni `Intl`.
import type { Periodo } from './fecha.ts';

// ICU escribe septiembre como "sept" (V5-02): el mes abreviado sale de una tabla propia.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const diaYMes = (f: string): string => {
  const [, m, d] = f.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
};

/** `AAAA-MM-DD` → `5 oct 2026`. */
export function formatearFechaTexto(f: string): string {
  return `${diaYMes(f)} ${f.slice(0, 4)}`;
}

/** `21 sep – 20 oct 2026`; el año es el del fin. */
export function formatearPeriodoCorto(p: Periodo): string {
  return `${diaYMes(p.inicio)} – ${formatearFechaTexto(p.fin)}`;
}
