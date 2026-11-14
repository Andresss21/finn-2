// [CH-274] Los nombres de «Agregar otra persona» (C-45, CAMPOS-V3 §9): solo texto, sin lecturas. Quien llama pasa las
// personas que ya conoce y las que ya están marcadas.

/** Vos más 19 da 20 líneas, el máximo de `lineas` (05). */
export const MAXIMO_PERSONAS = 19;

export interface PersonaConocida {
  readonly clave: string;
  readonly nombre: string;
}

export type NombreDePersona =
  | { readonly tipo: 'existente'; readonly persona: PersonaConocida }
  | { readonly tipo: 'nueva'; readonly nombre: string }
  | { readonly tipo: 'vacio' | 'propio' | 'maximo' };

const PROPIOS = new Set(['vos', 'yo']);
const comparable = (t: string) => capitalizarNombre(t).toLocaleLowerCase('es');

/** Sin espacios de más y cada palabra con mayúscula inicial; el resto, como se escribió. */
export const capitalizarNombre = (t: string): string =>
  t
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase('es') + p.slice(1))
    .join(' ');

/** Qué hacer con lo escrito: reutilizar a quien ya existe (sin importar mayúsculas), crear a alguien o rechazarlo. */
export function resolverNombre(
  escrito: string,
  conocidas: readonly PersonaConocida[],
  elegidas: readonly string[],
): NombreDePersona {
  const nombre = capitalizarNombre(escrito);
  if (nombre === '') return { tipo: 'vacio' };
  const clave = nombre.toLocaleLowerCase('es');
  if (PROPIOS.has(clave)) return { tipo: 'propio' };
  const persona = conocidas.find((p) => comparable(p.nombre) === clave);
  // Quien ya está marcado no suma una persona más.
  if (persona !== undefined && elegidas.includes(persona.clave))
    return { tipo: 'existente', persona };
  if (elegidas.length >= MAXIMO_PERSONAS) return { tipo: 'maximo' };
  return persona === undefined ? { tipo: 'nueva', nombre } : { tipo: 'existente', persona };
}
