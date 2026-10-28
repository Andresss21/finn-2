// Montos y revisión en la frontera (04 §13.3, §2.6; BE-08, BE-28, BE-29; ADR-15). Entrada: el monto es texto
// decimal (la interfaz no hace aritmética) y la revisión una cadena. Salida: el monto en centavos enteros y la
// revisión como cadena. Los textos están en voseo (7.6, 7.10); el signo de entrada es siempre el guion ASCII (CF-15).
import * as z from 'zod';
import { Centavos } from '@finn/dominio/valores';

/** Máximo de una columna `integer` en centavos: `21474836.47` (ADR-05). */
export const MAXIMO_CENTAVOS = 2_147_483_647;

const MONTO = /^\d{1,8}(\.\d{1,2})?$/;
const MONTO_CON_SIGNO = /^-?\d{1,8}(\.\d{1,2})?$/;
const REVISION = /^\d{1,19}$/;

const FORMATO = 'Ingresá un monto con hasta 8 dígitos y como máximo dos decimales.';
const EXCEDE = 'El monto no puede pasar de $21,474,836.47.';

function monto(formato: RegExp): z.ZodType<Centavos, string> {
  return z
    .string({ error: 'Ingresá un monto.' })
    .regex(formato, { error: FORMATO })
    .transform((t) => Centavos.desdeTexto(t))
    .refine((c) => Math.abs(c) <= MAXIMO_CENTAVOS, { error: EXCEDE });
}

/** `"1234.50"` → `Centavos`; sin signo. Un valor sobre el máximo es `VALIDACION`. */
export const montoTexto = monto(MONTO);

/** `"-1234.50"` → `Centavos` con signo (saldo inicial de tarjeta, ajuste de inversión, saldo del estado de cuenta). */
export const montoTextoConSigno = monto(MONTO_CON_SIGNO);

/** Revisión `bigint` como cadena decimal (BE-29); se compara como texto, nunca se convierte a `number`. */
export const revision = z
  .string({ error: 'La revisión no es válida.' })
  .regex(REVISION, { error: 'La revisión no es válida.' });

/** Salida hacia la interfaz: centavos enteros (la interfaz los divide solo para presentar) y revisión como texto. */
export type MontoSalida = Centavos;
export type RevisionSalida = string;
