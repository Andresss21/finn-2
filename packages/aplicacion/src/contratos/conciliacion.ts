// Contratos de la conciliación (04 §3.8; BE-08): OP-45 a OP-47 con la carga firmada (TA-184) y OP-53 Verificar saldo
// (CF-01). En una tarjeta `saldoEstado` positivo es deuda, como en OP-01: el dominio lo convierte a la convención de
// 01 §0.4. `revisionVista` y `huellaImpacto` los separa el marco.
import * as z from 'zod';
import { fechaLocal, montoTextoConSigno, uuid } from './comunes.ts';
import { op31 } from './eventos.ts';
import { op20, op21, op22, op23, op24, op27 } from './transacciones.ts';

export const op53 = z.object({
  id: uuid,
  cuentaId: uuid,
  fechaEstado: fechaLocal,
  saldoEstado: montoTextoConSigno,
  marcar: z.union([
    z.strictObject({ todas: z.literal(true) }),
    z.strictObject({ ids: z.array(uuid) }),
  ]),
});
export type EntradaOp53 = z.output<typeof op53>;

/** BE-06: el CSV del estado de cuenta, hasta 2 MiB. */
export const MAXIMO_ARCHIVO = 2 * 1024 * 1024;
const FALTA_CARGA = 'Falta el estado de cuenta.';
const carga = z.string({ error: FALTA_CARGA }).min(1, { error: FALTA_CARGA });
const indice = z.number({ error: 'Elegí un movimiento.' }).int().nonnegative();

/** OP-45 Iniciar conciliación: la cuenta y los bytes del archivo. */
export const op45 = z.object({
  cuentaId: uuid,
  archivo: z
    .instanceof(Uint8Array, { error: 'Elegí un archivo.' })
    .refine((b) => b.byteLength <= MAXIMO_ARCHIVO, {
      error: 'El archivo no puede pasar de 2 MB.',
    }),
});
export type EntradaOp45 = z.output<typeof op45>;

/** OP-46 Agregar desde el estado: el movimiento y el alta elegida con sus datos; la fecha la fija el movimiento. */
const alta = <O extends string, T extends z.ZodType>(operacion: O, datos: T) =>
  z.object({
    cuentaId: uuid,
    carga,
    movimientoIndice: indice,
    operacion: z.literal(operacion),
    datos,
  });
export const op46 = z.discriminatedUnion('operacion', [
  alta('OP-20', op20),
  alta('OP-21', op21),
  alta('OP-22', op22),
  alta('OP-23', op23),
  alta('OP-24', op24),
  alta('OP-27', op27),
  alta('OP-31', op31),
]);
export type EntradaOp46 = z.output<typeof op46>;

/** OP-47 Terminar conciliación: los pares que marcó el usuario. */
export const op47 = z.object({
  id: uuid,
  cuentaId: uuid,
  carga,
  coincidencias: z.array(z.object({ transaccionId: uuid, movimientoIndice: indice })),
});
export type EntradaOp47 = z.output<typeof op47>;
