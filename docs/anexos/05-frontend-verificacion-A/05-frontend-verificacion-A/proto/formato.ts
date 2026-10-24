// Prototipo del módulo único de formato de apps/web (05 §5.3, FE-17; gemelo de 04 §7.10).
// Los montos nunca pasan por un flotante: el entero en centavos se convierte a texto
// decimal y se le da a Intl.NumberFormat como cadena (ES2023, Intl.NumberFormat v3).
import type { Centavos } from './centavos.ts';

const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

/** "123450" → "1234.50"; con signo. Única conversión de centavos a texto decimal. */
export function centavosATextoDecimal(c: Centavos): string {
  const negativo = c < 0;
  const s = String(Math.abs(c)).padStart(3, '0');
  return `${negativo ? '-' : ''}${s.slice(0, -2)}.${s.slice(-2)}`;
}

export const formatearMonto = (c: Centavos): string =>
  moneda.format(centavosATextoDecimal(c) as unknown as number);

/** Vista previa de lo que el usuario escribió (texto ya normalizado por EntradaMonto). */
export const formatearMontoTexto = (texto: string): string =>
  moneda.format(texto as unknown as number);

// Fechas de negocio (FechaLocal 'AAAA-MM-DD'): reordenamiento de texto, sin Date ni Intl.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
export function formatearFecha(f: string): string {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}
export function formatearFechaTexto(f: string): string {
  const [a, m, d] = f.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}

// Instantes: Intl con la zona de El Salvador; se arma con formatToParts para no depender
// del separador que ICU ponga entre fecha y hora.
const partesInstante = new Intl.DateTimeFormat('es-SV', {
  timeZone: 'America/El_Salvador', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function formatearInstante(iso: string): string {
  const p = Object.fromEntries(partesInstante.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/** Puntos básicos (1 % = 100), entero ya redondeado por el selector. */
const porcentaje = new Intl.NumberFormat('es-SV', { style: 'percent', maximumFractionDigits: 2 });
export const formatearPorcentaje = (pb: number): string => porcentaje.format(`${pb}e-4` as unknown as number);
