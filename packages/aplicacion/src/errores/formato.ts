// Formato de montos y fechas del servidor (04 §7.10, §13.3; BE-34; V-18; CF-15). Único módulo de la aplicación que
// divide un monto entre 100 (ADR-21): lo hace con enteros y le pasa a `Intl` una cadena decimal, sin flotantes.
import type { Centavos } from '@finn/dominio/valores';

/** El signo menos tipográfico de todo texto que se muestra (CF-15). Las exportaciones usan el guion ASCII. */
export const MENOS = '−';

const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const instanteLocal = new Intl.DateTimeFormat('es-SV', {
  timeZone: 'America/El_Salvador',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
// ICU escribe septiembre como "sept" (05 V5-02): el mes abreviado sale de una tabla propia
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `$1,234.50`; negativo `−$45.00` con U+2212 (con `signo = '-'`, el guion ASCII de las exportaciones). */
export function formatearMonto(c: Centavos, signo: string = MENOS): string {
  const abs = Math.abs(c);
  const centavos = abs % 100;
  const texto = `${(abs - centavos) / 100}.${String(centavos).padStart(2, '0')}`;
  // Cadena decimal: Intl la formatea sin pasar por flotantes (el tipo de lib solo declara number | bigint)
  const base = moneda.format(texto as unknown as number);
  return c < 0 ? `${signo}${base}` : base;
}

/** `AAAA-MM-DD` → `05/10/2026`. */
export function formatearFecha(f: string): string {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

/** `AAAA-MM-DD` → `5 oct 2026` (texto corrido). */
export function formatearFechaCorrida(f: string): string {
  const [a, m, d] = f.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}

/** Instante ISO UTC → `05/10/2026 14:32` en America/El_Salvador. */
export function formatearInstante(iso: string): string {
  const p = Object.fromEntries(
    instanteLocal.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p['day']}/${p['month']}/${p['year']} ${p['hour']}:${p['minute']}`;
}
