// Normalización del monto escrito (05 §5.2, FE-17, V5-01) y la única aritmética permitida en el cliente (05 §5.1,
// PF-3): suma de líneas escritas y cuánto falta repartir, con `Centavos`. El resto es manipulación de texto.
import { Centavos } from '@finn/dominio/valores';

export type MotivoInvalido = 'max_dos_decimales' | 'mas_de_un_separador' | 'demasiado_grande';

export type ResultadoMonto =
  | { readonly estado: 'vacio' }
  | { readonly estado: 'incompleto' }
  | { readonly estado: 'invalido'; readonly motivo: MotivoInvalido }
  /** `texto` cumple `montoTexto` (04 §13.3): sin signo, hasta 8 enteros y 2 decimales. */
  | { readonly estado: 'valido'; readonly texto: string; readonly esCero: boolean };

export type Signo = 'positivo' | 'negativo';

/** 21474836.47 en centavos, de 10 cifras, para comparar como texto sin aritmética. */
const MAXIMO_CIFRAS = '2147483647';

/** Al teclear: se descarta todo carácter que no sea dígito, `.` o `,`. El signo nunca va en el texto. */
export function filtrarTecleo(texto: string): string {
  return texto.replace(/[^\d.,]/g, '');
}

const cuenta = (texto: string, caracter: string): number => texto.split(caracter).length - 1;

/**
 * Al pegar: quita `$`, `USD`, `US$` y espacios; un guion, U+2212 o U+2013 inicial, o los paréntesis, marcan
 * negativo (solo se aplica con `conSigno`). Con los dos separadores el último es el decimal; un mismo separador
 * repetido es de miles. Un único separador con tres cifras se deja para que la normalización lo marque.
 */
export function limpiarPegado(
  texto: string,
  conSigno: boolean,
): { readonly texto: string; readonly negativo: boolean } {
  const t = texto.trim();
  const marcaNegativo = /^[-−–]/.test(t) || /^\(.*\)$/.test(t);
  let s = filtrarTecleo(t.replace(/US\$|USD|\$|\s/gi, ''));
  const puntos = cuenta(s, '.');
  const comas = cuenta(s, ',');
  if (puntos > 0 && comas > 0) {
    const decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const miles = decimal === '.' ? ',' : '.';
    if (cuenta(s, decimal) === 1) s = s.replaceAll(miles, '').replace(decimal, '.');
  } else if (puntos > 1) {
    s = s.replaceAll('.', '');
  } else if (comas > 1) {
    s = s.replaceAll(',', '');
  }
  return { texto: s, negativo: conSigno && marcaNegativo };
}

/** Texto escrito (ya filtrado) → texto decimal que se envía, o el motivo por el que no se puede. */
export function normalizarMontoEscrito(escrito: string): ResultadoMonto {
  const t = filtrarTecleo(escrito);
  if (t === '') return { estado: 'vacio' };
  if (cuenta(t, '.') + cuenta(t, ',') > 1)
    return { estado: 'invalido', motivo: 'mas_de_un_separador' };
  const [enteros = '', decimales = ''] = t.split(/[.,]/);
  if (enteros === '' && decimales === '') return { estado: 'incompleto' };
  if (decimales.length > 2) return { estado: 'invalido', motivo: 'max_dos_decimales' };
  const sinCeros = enteros.replace(/^0+/, '');
  if (sinCeros.length > 8) return { estado: 'invalido', motivo: 'demasiado_grande' };
  const cifras = `${sinCeros.padStart(8, '0')}${decimales.padEnd(2, '0')}`;
  if (cifras > MAXIMO_CIFRAS) return { estado: 'invalido', motivo: 'demasiado_grande' };
  if (/^0+$/.test(cifras)) return { estado: 'valido', texto: '0', esCero: true };
  const texto = `${sinCeros === '' ? '0' : sinCeros}${decimales === '' ? '' : `.${decimales}`}`;
  return { estado: 'valido', texto, esCero: false };
}

/** Con signo negativo se antepone `-`, nunca a un cero (`montoTextoConSigno`). */
export function aplicarSigno(texto: string, signo: Signo): string {
  return signo === 'negativo' && !/^[0.]*$/.test(texto) ? `-${texto}` : texto;
}

function centavosDe(escrito: string): Centavos | undefined {
  const r = normalizarMontoEscrito(escrito);
  return r.estado === 'valido' ? Centavos.desdeTexto(r.texto) : undefined;
}

/** Σ de las líneas escritas (las vacías no suman). Si alguna no es un monto válido, `undefined`. */
export function sumarMontosEscritos(lineas: readonly string[]): Centavos | undefined {
  let total = Centavos.desdeTexto('0');
  for (const linea of lineas) {
    if (normalizarMontoEscrito(linea).estado === 'vacio') continue;
    const c = centavosDe(linea);
    if (c === undefined) return undefined;
    total = Centavos.sumar(total, c);
  }
  return total;
}

/** Cuánto falta repartir: total escrito − Σ líneas escritas. Solo para mostrar y habilitar el botón (05 §5.1). */
export function faltaRepartir(total: string, lineas: readonly string[]): Centavos | undefined {
  const t = centavosDe(total);
  const suma = sumarMontosEscritos(lineas);
  return t === undefined || suma === undefined ? undefined : Centavos.restar(t, suma);
}
