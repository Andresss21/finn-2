// Montos y revisiones entre la base y el dominio (04 §13.3; BE-28, BE-29; ADR-05, ADR-15). El monto es un
// `integer` de PostgreSQL en centavos; la revisión es un `bigint`, que viaja como texto decimal.
import { Centavos } from '@finn/dominio/valores';

const INT4_MAX = 2_147_483_647;

/** Lectura: el `integer` de la columna como `Centavos` (entero seguro). */
export const centavosDeEntero = (n: number): Centavos => Centavos.desdeEntero(n);

/** Escritura: `Centavos` a `integer`; fuera del rango de 32 bits es un error del llamador (ADR-05). */
export function enteroDeCentavos(c: Centavos): number {
  if (!Number.isInteger(c) || Math.abs(c) > INT4_MAX)
    throw new RangeError(`monto fuera de una columna integer: ${c}`);
  return c;
}

/** Lectura: `bigint` → cadena decimal (BE-29). */
export const revisionDeBigint = (r: bigint): string => r.toString();

/** Escritura o comparación: cadena decimal (`/^\d{1,19}$/`) → `bigint`. */
export function bigintDeRevision(r: string): bigint {
  if (!/^\d{1,19}$/.test(r)) throw new RangeError(`revisión con formato inválido: "${r}"`);
  return BigInt(r);
}
