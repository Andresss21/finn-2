// Los 8 colores de la cara de tarjeta (CH-225 c; 06-identidad-visual §2.9). El identificador es el valor que guarda
// `tarjetas.color` (03 §3.5: #RRGGBB, el tono más claro del degradado), no un color de estilo: la cara se pinta con
// `var(--tarjeta-<nombre>)` y aquí no hay ningún color escrito, solo el número del identificador (C-18, GLO-10).
// Un color nulo o fuera de la tabla (tarjetas anteriores) es oro.
const ID = (n: number): string => `#${n.toString(16).toUpperCase().padStart(6, '0')}`;

export const COLORES_TARJETA = [
  { nombre: 'oro', hex: ID(0x7e6638) },
  { nombre: 'plata', hex: ID(0x5c6670) },
  { nombre: 'grafito', hex: ID(0x2e3138) },
  { nombre: 'zafiro', hex: ID(0x24509a) },
  { nombre: 'rubi', hex: ID(0x7e2231) },
  { nombre: 'esmeralda', hex: ID(0x1a6043) },
  { nombre: 'amatista', hex: ID(0x52308c) },
  { nombre: 'cobre', hex: ID(0x7c4626) },
] as const;

export type NombreColorTarjeta =
  'oro' | 'plata' | 'grafito' | 'zafiro' | 'rubi' | 'esmeralda' | 'amatista' | 'cobre';

export const COLOR_ORO: string = ID(0x7e6638);

/** El nombre del token de la cara para el hex guardado; nulo o desconocido, `oro`. */
export function nombreDeColor(hex: string | null | undefined): NombreColorTarjeta {
  const buscado = hex?.toUpperCase();
  return COLORES_TARJETA.find((c) => c.hex === buscado)?.nombre ?? 'oro';
}
