// Montos (05 §5.4, CF-15): centavos a texto y a moneda. Sin flotantes: `Intl` recibe cadenas decimales.
import type { Centavos } from '@finn/dominio/valores';

/** Signo menos tipográfico al mostrar (CF-15). El CSV usa el guion ASCII (`formatearMontoCsv`). */
export const MENOS = '−';

// [CH-87] Se crea al primer uso: sin efectos al cargar, Turbopack puede dejar este archivo fuera de las pantallas que no
// formatean montos aunque importen `formato`.
let moneda: Intl.NumberFormat | undefined;
const formatoMoneda = (): Intl.NumberFormat =>
  (moneda ??= new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }));

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
  // El tipo de lib de `Intl` declara `number | bigint`, pero acepta cadenas decimales (ECMA-402).
  return conMenosTipografico(formatoMoneda().formatToParts(final as unknown as number));
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
