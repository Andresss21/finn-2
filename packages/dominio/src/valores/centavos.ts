// Dinero (02 ADR-15, RT-07): centavos enteros y solo tres redondeos [CH-17]. Único módulo que divide montos
// (ADR-21); toda división es entera, sin pasar por flotantes.

/** Monto en centavos enteros de USD. Solo lo crean los constructores de este módulo. */
export type Centavos = number & { readonly __marca: 'Centavos' };

const MONTO_TEXTO = /^(-)?(\d{1,8})(?:\.(\d{1,2}))?$/;

function entero(n: number, que: string): number {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${que}: ${n} no es un entero seguro`);
  return n;
}

/** Normaliza −0 a 0 para que el valor sea uno solo. */
const desdeEntero = (n: number): Centavos => (entero(n, 'centavos') + 0) as Centavos;

/** ⌊x / y⌋ para x ≥ 0 e y > 0 enteros seguros, exacta: el resto entero se resta antes de dividir. */
const cocienteEntero = (x: number, y: number): number => (x - (x % y)) / y;

/**
 * Texto decimal de 04 §13.3 (`montoTexto` y `montoTextoConSigno`: hasta 8 enteros y 2 decimales)
 * a centavos, sin flotantes. El límite de la columna lo valida el contrato, no el valor.
 */
function desdeTexto(texto: string): Centavos {
  const m = MONTO_TEXTO.exec(texto);
  if (m === null) throw new RangeError(`monto inválido: "${texto}"`);
  const [, signo, enteros, decimales] = m;
  const absoluto = Number(enteros) * 100 + Number((decimales ?? '').padEnd(2, '0'));
  return desdeEntero(signo === undefined ? absoluto : -absoluto);
}

const sumar = (a: Centavos, b: Centavos): Centavos => desdeEntero(a + b);
const restar = (a: Centavos, b: Centavos): Centavos => desdeEntero(a - b);
const negar = (a: Centavos): Centavos => desdeEntero(0 - a);
const min = (a: Centavos, b: Centavos): Centavos => (a <= b ? a : b);
const max = (a: Centavos, b: Centavos): Centavos => (a >= b ? a : b);
const comparar = (a: Centavos, b: Centavos): -1 | 0 | 1 => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Meta semanal (01 §4.12, H11): redondeo al centavo, mitad hacia arriba, de monto × días / 7,
 * como ⌊(2·m·d + 7) / 14⌋ (ADR-15). Exige monto ≥ 0 y días ≥ 1.
 */
function metaSemanalDelPeriodo(monto: Centavos, dias: number): Centavos {
  if (monto < 0) throw new RangeError(`meta semanal negativa: ${monto}`);
  if (entero(dias, 'días') < 1) throw new RangeError(`duración inválida: ${dias}`);
  return desdeEntero(cocienteEntero(entero(2 * monto * dias + 7, 'meta semanal'), 14));
}

/**
 * Metas de ahorro (01 §4.12): ⌈monto / períodos⌉ como ⌊(a + n − 1) / n⌋ (ADR-15), para que la
 * suma de las cuotas alcance la meta. Exige monto ≥ 0 y períodos ≥ 1.
 */
function cuotaConTecho(monto: Centavos, periodos: number): Centavos {
  if (monto < 0) throw new RangeError(`meta de ahorro negativa: ${monto}`);
  if (entero(periodos, 'períodos') < 1) throw new RangeError(`períodos inválidos: ${periodos}`);
  return desdeEntero(cocienteEntero(entero(monto + (periodos - 1), 'meta de ahorro'), periodos));
}

/**
 * Proporción del Anexo A (01 §0.4, ADR-15 [CH-17]): redondear(B × num / den) al centavo, mitad hacia
 * arriba, como ⌊(2·B·num + den) / (2·den)⌋, en `bigint` porque B·num puede pasar 2^53. Interés:
 * num = tasa en millonésimas × días, den = 365 × 10⁶; seguro: num = S₁, den = M. Exige B ≥ 0,
 * num ≥ 0 y den ≥ 1 enteros.
 */
function proporcionMitadArriba(base: Centavos, num: number, den: number): Centavos {
  if (base < 0 || entero(num, 'numerador') < 0 || entero(den, 'denominador') < 1)
    throw new RangeError(`proporción inválida: ${base} × ${num} / ${den}`);
  const d = BigInt(den);
  return desdeEntero(Number((2n * BigInt(base) * BigInt(num) + d) / (2n * d)));
}

export const Centavos = {
  cero: 0 as Centavos,
  desdeEntero,
  desdeTexto,
  sumar,
  restar,
  negar,
  min,
  max,
  comparar,
  metaSemanalDelPeriodo,
  cuotaConTecho,
  proporcionMitadArriba,
} as const;
