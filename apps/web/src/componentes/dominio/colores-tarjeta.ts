// Los 8 colores de la cara de tarjeta (CH-225 c; 06-identidad-visual §2.9). El hex es el identificador que guarda
// `tarjetas.color` (03 §3.5, el tono más claro del degradado), no un color de estilo: la cara se pinta con
// `var(--tarjeta-<nombre>)`. Un color nulo o fuera de la tabla (tarjetas anteriores) es oro.
export const COLORES_TARJETA = [
  { nombre: 'oro', hex: '#7E6638' },
  { nombre: 'plata', hex: '#5C6670' },
  { nombre: 'grafito', hex: '#2E3138' },
  { nombre: 'zafiro', hex: '#24509A' },
  { nombre: 'rubi', hex: '#7E2231' },
  { nombre: 'esmeralda', hex: '#1A6043' },
  { nombre: 'amatista', hex: '#52308C' },
  { nombre: 'cobre', hex: '#7C4626' },
] as const;

export type NombreColorTarjeta = (typeof COLORES_TARJETA)[number]['nombre'];

export const COLOR_ORO = '#7E6638';

/** El nombre del token de la cara para el hex guardado; nulo o desconocido, `oro`. */
export function nombreDeColor(hex: string | null | undefined): NombreColorTarjeta {
  const buscado = hex?.toUpperCase();
  return COLORES_TARJETA.find((c) => c.hex === buscado)?.nombre ?? 'oro';
}
