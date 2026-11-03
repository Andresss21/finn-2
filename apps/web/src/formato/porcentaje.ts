// Porcentajes desde puntos básicos (05 §5.4). Sin flotantes: `Intl` recibe una cadena decimal.

// [CH-87] Se crea al primer uso: sin efectos al cargar (ver monto.ts).
let porcentaje: Intl.NumberFormat | undefined;
const formatoPorcentaje = (): Intl.NumberFormat =>
  (porcentaje ??= new Intl.NumberFormat('es-SV', { style: 'percent', maximumFractionDigits: 2 }));

/** Puntos básicos → porcentaje: `4550` → `45.5%`; `10000` → `100%`. No divide: pasa `"<pb>e-4"`. */
export function formatearPorcentaje(pb: number): string {
  // El tipo de lib de `Intl` declara `number | bigint`, pero acepta cadenas decimales (ECMA-402).
  return formatoPorcentaje().format(`${pb}e-4` as unknown as number);
}
