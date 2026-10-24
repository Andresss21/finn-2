// Prototipo mínimo de @finn/dominio/valores (Centavos), solo lo que usa la Parte A de 05.
// Conversión de texto decimal a centavos sin flotantes (ADR-15, 04 §13.3).
export type Centavos = number & { readonly __marca: 'Centavos' };

const MAXIMO = 2_147_483_647; // 21474836.47: límite de una columna integer (ADR-05, 04 §13.3)

export function desdeEntero(n: number): Centavos {
  if (!Number.isSafeInteger(n)) throw new Error('centavos_no_entero');
  return n as Centavos;
}

/** Acepta exactamente el formato de montoTexto / montoTextoConSigno de 04 §13.3. */
export function desdeTexto(texto: string): Centavos {
  const m = /^(-)?(\d{1,8})(?:\.(\d{1,2}))?$/.exec(texto);
  if (!m) throw new Error('monto_texto_invalido');
  const [, signo, entero, dec = ''] = m;
  const c = Number(entero) * 100 + Number(dec.padEnd(2, '0'));
  if (c > MAXIMO) throw new Error('monto_fuera_de_rango');
  return (signo && c !== 0 ? -c : c) as Centavos;
}

export const sumar = (a: Centavos, b: Centavos): Centavos => desdeEntero(a + b);
export const restar = (a: Centavos, b: Centavos): Centavos => desdeEntero(a - b);
export const MAXIMO_CENTAVOS = MAXIMO as Centavos;
