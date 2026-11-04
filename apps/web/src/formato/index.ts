// Módulo de formato de la interfaz (05 §5.4, FE-18, CF-15). Único lugar de apps/web que convierte centavos a
// texto y que formatea montos, fechas, instantes y porcentajes. Sin flotantes: todo `Intl` recibe cadenas decimales.
// [CH-87] Solo reexporta: Turbopack copia este módulo en el JS de cada pantalla que formatea, y una función que una
// sola pantalla empezara a usar entraría en todas las copias. Con un archivo por grupo, cada pantalla lleva solo lo
// que importa. Una función nueva va en el archivo de su grupo o en uno propio, nunca con código acá.
export {
  MENOS,
  centavosATextoDecimal,
  formatearMonto,
  formatearMontoAccesible,
  formatearMontoCsv,
  formatearMontoTexto,
} from './monto.ts';
export { formatearFecha, formatearPeriodo } from './fecha.ts';
export {
  formatearFechaTexto,
  formatearPeriodoCorto,
  formatearPeriodoNumerico,
} from './fecha-texto.ts';
export { formatearInstante } from './instante-texto.ts';
export { formatearPorcentaje } from './porcentaje.ts';
