// Las tandas de la plantilla (06 §3.9.1, CF-19): 4 de hasta 12 elementos (3 si caben en 36 o menos), nunca más de 15 por llamada.
// Parte la lista en orden, así cada grupo va antes que sus categorías.
const MAXIMO_POR_LLAMADA = 15;

export function tamanoDeTanda(total: number): number {
  const tandas = Math.max(total <= 36 ? 3 : 4, Math.ceil(total / MAXIMO_POR_LLAMADA));
  return Math.max(1, Math.ceil(total / tandas));
}

/** Parte `pendientes` en tandas del tamaño que le corresponde a una plantilla de `total` elementos. */
export function tandas<T>(pendientes: readonly T[], total: number): T[][] {
  const tamano = tamanoDeTanda(total);
  const salida: T[][] = [];
  for (let i = 0; i < pendientes.length; i += tamano) salida.push(pendientes.slice(i, i + tamano));
  return salida;
}
