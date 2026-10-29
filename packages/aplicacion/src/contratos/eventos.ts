// Contratos de las operaciones de eventos OP-31 (cobrar) y OP-52 (renombrar deudor) (04 §3.5; BE-08). La salida de
// cada esquema ya es la entrada del dominio: montos en `Centavos`, fechas como `FechaLocal`.
import * as z from 'zod';
import { fechaLocal, textoLimpio, uuid } from './comunes.ts';
import { montoPositivo } from './transacciones.ts';

/** OP-31 Cobrar: `cuentaId` es de efectivo o de tarjeta; `asignarAPagoTarjeta` es la casilla de AV-22 (BE-36). */
export const op31 = z.object({
  id: uuid,
  lineaId: uuid,
  cuentaId: uuid,
  fecha: fechaLocal,
  total: montoPositivo,
  asignarAPagoTarjeta: z.boolean().optional(),
});
export type EntradaOp31 = z.output<typeof op31>;

/** OP-52 Renombrar deudor: valor absoluto, con el nombre que vio la interfaz (4.6.2). */
export const op52 = z.object({
  deudorId: uuid,
  nombre: textoLimpio,
  esperado: z.object({ nombre: textoLimpio }),
});
export type EntradaOp52 = z.output<typeof op52>;
