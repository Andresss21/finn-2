// Contratos de las operaciones de eventos OP-31 a OP-34 (cobrar, condonar, devolver, eliminar evento) y OP-52 (04 §3.5; BE-08). La salida de
// cada esquema ya es la entrada del dominio: montos en `Centavos`, fechas como `FechaLocal`.
import * as z from 'zod';
import { fechaLocal, textoLimpio, uuid } from './comunes.ts';
import { montoPositivo, op29 } from './transacciones.ts';

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

/** OP-32 Condonar: `categoriaId` es la categoría normal y activa que absorbe el consumo (la propuesta es de la consulta). */
export const op32 = z.object({
  id: uuid,
  lineaId: uuid,
  monto: montoPositivo,
  fecha: fechaLocal,
  categoriaId: uuid,
});
export type EntradaOp32 = z.output<typeof op32>;

/**
 * OP-33 Devolver: a) vinculada a una compra (`transaccionOriginalId` y `reparto`; `cuentaId` por defecto la de la
 * compra) o b) sin compra original (`cuentaId` y `categoriaId`). Los campos de la otra forma no se aceptan.
 */
export const op33 = z
  .object({
    id: uuid,
    fecha: fechaLocal,
    total: montoPositivo,
    cuentaId: uuid.optional(),
    transaccionOriginalId: uuid.optional(),
    reparto: z
      .array(z.object({ lineaId: uuid, monto: montoPositivo }))
      .min(1, { error: 'Agregá al menos una parte.' })
      .max(20, { error: 'Máximo 20 partes.' })
      .optional(),
    categoriaId: uuid.optional(),
  })
  .superRefine((e, ctx) => {
    const falta = (path: string, message: string) => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (e.transaccionOriginalId !== undefined) {
      if (e.reparto === undefined) falta('reparto', 'Indicá cuánto devolver de cada parte.');
      if (e.categoriaId !== undefined)
        falta('categoriaId', 'Una devolución vinculada no lleva categoría.');
    } else {
      if (e.cuentaId === undefined) falta('cuentaId', 'Elegí la cuenta.');
      if (e.categoriaId === undefined) falta('categoriaId', 'Elegí la categoría.');
      if (e.reparto !== undefined) falta('reparto', 'Sin compra original no hay reparto.');
    }
  });
export type EntradaOp33 = z.output<typeof op33>;

/** OP-34 Eliminar evento: un cobro o una devolución (su transacción) o una condonación (su fila). */
export const op34 = z.discriminatedUnion('tipo', [
  op29.extend({ tipo: z.enum(['cobro', 'devolucion']) }),
  z.object({ tipo: z.literal('condonacion'), condonacionId: uuid }),
]);
export type EntradaOp34 = z.output<typeof op34>;
