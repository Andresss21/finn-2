// Módulo de formato de la interfaz (05 §5.4, FE-18, CF-15). Único lugar de apps/web que convierte centavos a
// texto y que formatea montos, fechas, instantes y porcentajes. Sin flotantes: todo `Intl` recibe cadenas decimales.
import type { Centavos } from '@finn/dominio/valores';

/** Signo menos tipográfico al mostrar (CF-15). El CSV usa el guion ASCII (`formatearMontoCsv`). */
export const MENOS = '−';

const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const porcentaje = new Intl.NumberFormat('es-SV', { style: 'percent', maximumFractionDigits: 2 });
const instanteLocal = new Intl.DateTimeFormat('es-SV', {
  timeZone: 'America/El_Salvador',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
// ICU escribe septiembre como "sept" (V5-02): el mes abreviado sale de una tabla propia.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// El tipo de lib de `Intl` declara `number | bigint`, pero acepta cadenas decimales (ECMA-402).
const comoEntrada = (t: string): number => t as unknown as number;

/** `123450` → `"1234.50"`; `-1` → `"-0.01"`. Solo texto: ceros de relleno y corte de las dos últimas cifras. */
export function centavosATextoDecimal(c: Centavos): string {
  const abs = String(Math.abs(c)).padStart(3, '0');
  const texto = `${abs.slice(0, -2)}.${abs.slice(-2)}`;
  return c < 0 ? `-${texto}` : texto;
}

function conMenosTipografico(partes: Intl.NumberFormatPart[]): string {
  return partes.map((p) => (p.type === 'minusSign' ? MENOS : p.value)).join('');
}

/** Texto decimal normalizado (05 §5.2) → `$12.30`; negativo `−$45.00`. Un "-0.00" no lleva signo. */
export function formatearMontoTexto(t: string): string {
  const negativo = t.startsWith('-');
  const [entera = '0', fraccion = ''] = (negativo ? t.slice(1) : t).split('.');
  const normal = `${entera === '' ? '0' : entera}.${fraccion.padEnd(2, '0')}`;
  const esCero = /^[0.]*$/.test(normal);
  const final = negativo && !esCero ? `-${normal}` : normal;
  return conMenosTipografico(moneda.formatToParts(comoEntrada(final)));
}

/** `123450` → `$1,234.50`; negativo `−$45.00` con U+2212. */
export function formatearMonto(c: Centavos): string {
  return formatearMontoTexto(centavosATextoDecimal(c));
}

/** Texto accesible de un monto: `menos $1,234.50` (algunos lectores no leen el guion como "menos"). */
export function formatearMontoAccesible(c: Centavos): string {
  const abs = formatearMonto(Math.abs(c) as Centavos);
  return c < 0 ? `menos ${abs}` : abs;
}

/** Monto para el CSV (OPT-08): decimal con el guion ASCII, sin símbolo ni separador de miles (`-45.00`). */
export function formatearMontoCsv(c: Centavos): string {
  return centavosATextoDecimal(c);
}

/** `AAAA-MM-DD` → `05/10/2026`. Reordena el texto; sin `Date` ni `Intl`. */
export function formatearFecha(f: string): string {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

const diaYMes = (f: string): string => {
  const [, m, d] = f.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
};

/** `AAAA-MM-DD` → `5 oct 2026`. */
export function formatearFechaTexto(f: string): string {
  return `${diaYMes(f)} ${f.slice(0, 4)}`;
}

interface Periodo {
  readonly inicio: string;
  readonly fin: string;
}

/** `21/09/2026 – 20/10/2026`. */
export function formatearPeriodo(p: Periodo): string {
  return `${formatearFecha(p.inicio)} – ${formatearFecha(p.fin)}`;
}

/** `21 sep – 20 oct 2026`; el año es el del fin. */
export function formatearPeriodoCorto(p: Periodo): string {
  return `${diaYMes(p.inicio)} – ${formatearFechaTexto(p.fin)}`;
}

/** Instante ISO UTC → `05/10/2026 14:32` en America/El_Salvador. ICU pone una coma: se arma con `formatToParts`. */
export function formatearInstante(iso: string): string {
  const p = Object.fromEntries(
    instanteLocal.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p['day']}/${p['month']}/${p['year']} ${p['hour']}:${p['minute']}`;
}

/** Puntos básicos → porcentaje: `4550` → `45.5%`; `10000` → `100%`. No divide: pasa `"<pb>e-4"`. */
export function formatearPorcentaje(pb: number): string {
  return porcentaje.format(comoEntrada(`${pb}e-4`));
}
