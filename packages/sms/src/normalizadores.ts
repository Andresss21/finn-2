// Normalizadores de los grupos de un patrón (03 §7.6). Devuelven null cuando el texto no es válido:
// un SMS cuyo grupo no normaliza no coincide (nunca se guarda un valor erróneo).
import { Centavos, FechaLocal } from '@finn/dominio/valores';

export type FormatoFecha = 'AAAA/MM/DD' | 'AAAAMMDD' | 'AAAA-MM-DD' | 'DD/MM/AAAA';

/** 21.474.836,47: el máximo que cabe en la columna `integer` de centavos (04 §13.3). */
const MONTO_MAXIMO = 2_147_483_647;

const MONTO = /^\d+(?:\.\d{1,2})?$/;
const ULTIMOS4 = /^\d{4}$/;

export function normalizarUltimos4(texto: string): string | null {
  return ULTIMOS4.test(texto) ? texto : null;
}

/** Quita miles, pasa el decimal a `.`, valida la forma y convierte por texto (sin flotantes). */
export function normalizarMonto(
  texto: string,
  miles: ',' | '.' | '',
  decimal: '.' | ',',
): Centavos | null {
  let t = texto.trim();
  if (miles !== '') t = t.split(miles).join('');
  if (decimal !== '.') t = t.split(decimal).join('.');
  if (!MONTO.test(t)) return null;
  const sinCeros = t.replace(/^0+(?=\d)/, '');
  let centavos: Centavos;
  try {
    centavos = Centavos.desdeTexto(sinCeros);
  } catch {
    return null; // más de 8 enteros
  }
  return centavos > 0 && centavos <= MONTO_MAXIMO ? centavos : null;
}

const FORMAS: Record<FormatoFecha, { re: RegExp; orden: readonly [number, number, number] }> = {
  'AAAA/MM/DD': { re: /^(\d{4})\/(\d{2})\/(\d{2})$/, orden: [1, 2, 3] },
  AAAAMMDD: { re: /^(\d{4})(\d{2})(\d{2})$/, orden: [1, 2, 3] },
  'AAAA-MM-DD': { re: /^(\d{4})-(\d{2})-(\d{2})$/, orden: [1, 2, 3] },
  'DD/MM/AAAA': { re: /^(\d{2})\/(\d{2})\/(\d{4})$/, orden: [3, 2, 1] },
};

/** Prueba cada formato en orden; el primero que produce una fecha existente gana. */
export function normalizarFecha(
  texto: string,
  formatos: readonly FormatoFecha[],
): FechaLocal | null {
  for (const formato of formatos) {
    const { re, orden } = FORMAS[formato];
    const m = re.exec(texto);
    if (m === null) continue;
    try {
      return FechaLocal.desdePartes(Number(m[orden[0]]), Number(m[orden[1]]), Number(m[orden[2]]));
    } catch {
      continue; // día o mes inexistente
    }
  }
  return null;
}

/** Recorte y espacios repetidos reducidos a uno; vacío o ausente → sin comercio. */
export function normalizarComercio(texto: string | undefined): string | null {
  if (texto === undefined) return null;
  const limpio = texto.trim().replace(/\s+/g, ' ');
  return limpio === '' ? null : limpio;
}
