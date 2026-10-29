// Contratos de las operaciones de registro OP-20 a OP-24 y OP-27 (04 §3.4; BE-08). La salida de cada esquema ya es la
// entrada del dominio: montos en `Centavos`, fechas como `FechaLocal`. `revisionVista` y `huellaImpacto` los separa
// el marco antes de validar. Todo monto de una alta es mayor que cero (CB-28), salvo el desglose de una cuota.
import * as z from 'zod';
import type { DecimalTexto, DestinoLinea, Uuid } from '@finn/dominio';
import { fechaLocal, montoTexto, textoLimpio, uuid } from './comunes.ts';

const POSITIVO = 'Ingresá un monto mayor que cero.';
/** `MontoTexto` de 04 §3.0.2: mayor que cero. */
export const montoPositivo = montoTexto.refine((c) => c > 0, { error: POSITIVO });

/** `numeric(18,4)` positivo (03 §4.5): texto decimal, nunca un número de coma flotante. */
const montoOriginal = z
  .string({ error: 'Ingresá un monto.' })
  .regex(/^\d{1,14}(\.\d{1,4})?$/, { error: 'Ingresá un monto con hasta 4 decimales.' })
  .refine((t) => /[1-9]/.test(t), { error: POSITIVO })
  .transform((t) => t as DecimalTexto);

/** Campos comunes opcionales de las altas (04 §3.4); la moneda y su monto, juntos (M4). */
const COMUNES = {
  comercio: textoLimpio.optional(),
  nota: z
    .string({ error: 'Ingresá un texto.' })
    .max(500, { error: 'La nota no puede pasar de 500 caracteres.' })
    .optional(),
  monedaOriginal: z
    .string({ error: 'Ingresá la moneda.' })
    .regex(/^[A-Z]{3}$/, { error: 'La moneda son tres letras mayúsculas.' })
    .optional(),
  montoOriginal: montoOriginal.optional(),
};

/** M4: la moneda original y su monto van juntos o ninguno. */
function juntos(
  e: { monedaOriginal?: string | undefined; montoOriginal?: string | undefined },
  ctx: z.RefinementCtx,
): void {
  if ((e.monedaOriginal === undefined) !== (e.montoOriginal === undefined))
    ctx.addIssue({
      code: 'custom',
      path: [e.monedaOriginal === undefined ? 'monedaOriginal' : 'montoOriginal'],
      message: 'Ingresá la moneda y el monto originales juntos.',
    });
}

const BASE = { id: uuid, fecha: fechaLocal, total: montoPositivo, ...COMUNES };

/** Destino de una línea (04 §3.0.2): una categoría, un deudor o un deudor nuevo. */
const destino = z.union([
  z.strictObject({ categoriaId: uuid }),
  z.strictObject({ deudorId: uuid }),
  z.strictObject({ deudorNuevo: textoLimpio }),
]) as z.ZodType<DestinoLinea>;

/** OP-20 Registrar gasto: una cuenta de efectivo o tarjeta y de 1 a 20 líneas. */
export const op20 = z
  .object({
    ...BASE,
    cuentaId: uuid,
    lineas: z
      .array(z.object({ monto: montoPositivo, destino }))
      .min(1, { error: 'Agregá al menos una parte.' })
      .max(20, { error: 'Máximo 20 partes.' }),
  })
  .superRefine(juntos);
export type EntradaOp20 = z.output<typeof op20>;

/** OP-21 Registrar ingreso. */
export const op21 = z.object({ ...BASE, cuentaId: uuid }).superRefine(juntos);
export type EntradaOp21 = z.output<typeof op21>;

/** OP-22 Transferencia neutral entre dos cuentas de efectivo. */
export const op22 = z.object({ ...BASE, origenId: uuid, destinoId: uuid }).superRefine(juntos);
export type EntradaOp22 = z.output<typeof op22>;

/** OP-23 Pagar tarjeta. */
export const op23 = z.object({ ...BASE, origenId: uuid, tarjetaId: uuid }).superRefine(juntos);
export type EntradaOp23 = z.output<typeof op23>;

const parte = montoTexto; // capital, interés y seguro pueden ser "0"

/**
 * OP-24 Pagar cuota de préstamo o abonar a capital. En una cuota la entrada trae el desglose que confirmó o corrigió
 * el usuario; en un abono todo el total es capital (el dominio lo exige: interés y seguro en cero).
 */
export const op24 = z.discriminatedUnion('modalidad', [
  z
    .object({
      ...BASE,
      modalidad: z.literal('cuota'),
      origenId: uuid,
      prestamoId: uuid,
      categoriaId: uuid,
      capital: parte,
      interes: parte,
      seguro: parte,
      numeroCuota: z.number({ error: 'Ingresá un número.' }).int().min(1).optional(),
    })
    .superRefine(juntos),
  z
    .object({
      ...BASE,
      modalidad: z.literal('abono'),
      origenId: uuid,
      prestamoId: uuid,
      categoriaId: uuid,
    })
    .superRefine(juntos),
]);
export type EntradaOp24 = z.output<typeof op24>;

/** OP-27 Movimientos de tarjeta sin compra: avance, entrada o transferencia de deuda. */
export const op27 = z.discriminatedUnion('modalidad', [
  z
    .object({ ...BASE, modalidad: z.literal('avance'), tarjetaId: uuid, cuentaId: uuid })
    .superRefine(juntos),
  z.object({ ...BASE, modalidad: z.literal('entrada'), tarjetaId: uuid }).superRefine(juntos),
  z
    .object({
      ...BASE,
      modalidad: z.literal('transferencia_deuda'),
      tarjetaId: uuid,
      tarjetaDestinoId: uuid,
    })
    .superRefine(juntos),
]);
export type EntradaOp27 = z.output<typeof op27>;

/** Salida común (04 §3.0.3): el `id` de la transacción creada. */
export interface SalidaTransaccion {
  readonly id?: Uuid;
}
