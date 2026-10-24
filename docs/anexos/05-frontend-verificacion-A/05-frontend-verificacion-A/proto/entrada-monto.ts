// Prototipo de la lógica pura de EntradaMonto (05 §5.2, FE-16).
// El componente guarda el texto tal como lo escribe el usuario; esta función decide
// qué se muestra y qué texto se envía. No hace aritmética con montos (PF-3): solo
// compara contra el máximo con desdeTexto.
import { desdeTexto, MAXIMO_CENTAVOS } from './centavos.ts';

export type MotivoMonto =
  | 'mas_de_un_separador'   // "1.2.3", "1,2.3"
  | 'max_dos_decimales'     // "1,234" o "1.234" (posible separador de miles)
  | 'demasiado_grande';     // más de 8 cifras enteras o > 21474836.47

export type EstadoMonto =
  | { estado: 'vacio' }
  | { estado: 'incompleto' }                                   // solo un separador
  | { estado: 'invalido'; motivo: MotivoMonto }
  | { estado: 'valido'; normalizado: string; esCero: boolean }; // normalizado cumple montoTexto

/** Caracteres que el campo deja escribir. Todo lo demás se descarta al teclear. */
export const filtrarTecleo = (texto: string): string => texto.replace(/[^0-9.,]/g, '');

export function normalizarMontoEscrito(texto: string): EstadoMonto {
  const t = filtrarTecleo(texto);
  if (t === '') return { estado: 'vacio' };
  const separadores = t.match(/[.,]/g) ?? [];
  if (separadores.length > 1) return { estado: 'invalido', motivo: 'mas_de_un_separador' };
  const [enteroCrudo = '', dec = ''] = t.split(/[.,]/);
  if (dec.length > 2) return { estado: 'invalido', motivo: 'max_dos_decimales' };
  if (enteroCrudo === '' && dec === '') return { estado: 'incompleto' };
  const entero = enteroCrudo.replace(/^0+(?=\d)/, '') || '0';
  if (entero.length > 8) return { estado: 'invalido', motivo: 'demasiado_grande' };
  const normalizado = dec === '' ? entero : `${entero}.${dec}`;
  let c: number;
  try { c = desdeTexto(normalizado); } catch { return { estado: 'invalido', motivo: 'demasiado_grande' }; }
  if (c > MAXIMO_CENTAVOS) return { estado: 'invalido', motivo: 'demasiado_grande' };
  return { estado: 'valido', normalizado, esCero: c === 0 };
}

/** Texto que se envía al servidor (montoTexto o montoTextoConSigno). Nunca "-0". */
export function textoParaEnviar(e: EstadoMonto, signo: 'positivo' | 'negativo' = 'positivo'): string | null {
  if (e.estado !== 'valido') return null;
  return signo === 'negativo' && !e.esCero ? `-${e.normalizado}` : e.normalizado;
}

/**
 * Pegado: limpia símbolos y, solo si el texto pegado trae los dos separadores o un
 * mismo separador repetido, interpreta los de miles. Un único separador seguido de
 * tres cifras ("1,234") se deja tal cual para que normalizar lo marque como ambiguo.
 */
export function limpiarPegado(texto: string): { texto: string; negativo: boolean } {
  let t = texto.trim();
  const negativo = /^[-−]|^\(.*\)$/.test(t.replace(/^\$|^USD\s?|^US\$/i, ''));
  t = t.replace(/USD|US\$|\$|\s|[-−()]/gi, '');
  const puntos = (t.match(/\./g) ?? []).length;
  const comas = (t.match(/,/g) ?? []).length;
  if (puntos > 0 && comas > 0) {
    const ultimo = Math.max(t.lastIndexOf('.'), t.lastIndexOf(','));
    t = t.slice(0, ultimo).replace(/[.,]/g, '') + '.' + t.slice(ultimo + 1);
  } else if (puntos > 1 || comas > 1) {
    t = t.replace(/[.,]/g, '');
  }
  return { texto: filtrarTecleo(t), negativo };
}
