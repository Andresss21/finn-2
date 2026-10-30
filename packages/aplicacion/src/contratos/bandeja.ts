// Contratos de OP-36, OP-37, OP-39 y OP-40 (04 §3.6; BE-08). `esperado` habla como el `MovimientoDto` de 6.8 (centavos).
import * as z from 'zod';
import type { DestinoMovimiento, Uuid } from '@finn/dominio';
import { fechaLocal, textoLimpio, uuid } from './comunes.ts';
import { destinoLinea, montoPositivo } from './transacciones.ts';

const destinoMovimiento = z.union([
  destinoLinea,
  z.strictObject({ lineaOriginalId: uuid }),
]) as z.ZodType<DestinoMovimiento>;

const lineaVista = z.object({
  monto: z.number().int(),
  categoriaId: uuid.nullable(),
  deudorId: uuid.nullable(),
  lineaOriginalId: uuid.nullable(),
});
export type LineaVista = z.output<typeof lineaVista>;

const esperadoOp36 = z.object({
  cuentaId: uuid.nullable(),
  fecha: z.string().nullable(),
  monto: z.number().int().nullable(),
  comercio: z.string().nullable(),
  tipoPropuesto: z.string().nullable(),
  nota: z.string().nullable(),
  lineas: z.array(lineaVista),
});

export const CAMPOS_OP36 = Object.keys(esperadoOp36.shape) as (keyof typeof esperadoOp36.shape)[];

const FALTA = 'Falta el valor que viste.';
const nulable = <T extends z.ZodType>(t: T) => t.nullable().optional();

/** OP-36 Editar movimiento: solo los campos que cambian; `lineas` es la lista completa; `comercio` y `nota` aceptan `null`. */
export const op36 = z
  .object({
    movimientoId: uuid,
    cuentaId: uuid.optional(),
    fecha: fechaLocal.optional(),
    monto: montoPositivo.optional(),
    comercio: nulable(textoLimpio),
    tipoPropuesto: z.enum(['gasto', 'ingreso', 'pago_tarjeta', 'devolucion']).optional(),
    nota: nulable(z.string().max(500, { error: 'La nota no puede pasar de 500 caracteres.' })),
    lineas: z
      .array(z.object({ monto: montoPositivo, destino: destinoMovimiento.optional() }))
      .max(20, { error: 'Máximo 20 partes.' })
      .optional(),
    esperado: esperadoOp36.partial(),
  })
  .superRefine((e, ctx) => {
    const cambios = CAMPOS_OP36.filter((k) => e[k] !== undefined);
    if (cambios.length === 0) ctx.addIssue({ code: 'custom', message: 'No hay nada que cambiar.' });
    for (const k of cambios)
      if (e.esperado[k] === undefined)
        ctx.addIssue({
          code: 'custom',
          path: ['esperado', k],
          message: FALTA,
        });
  });
export type EntradaOp36 = z.output<typeof op36>;

const APROBACION = {
  movimientoId: uuid,
  id: uuid,
  origenId: uuid.optional(),
  recordarRegla: z.boolean().optional(),
};

/**
 * OP-37 Aprobar movimiento. Con `categoriaId` es la variante "aprobar con categoría" (CF-21): trae las líneas que vio la
 * lista en `esperado` y no admite `recordarRegla`.
 */
export const op37 = z
  .object({
    ...APROBACION,
    categoriaId: uuid.optional(),
    esperado: z.object({ lineas: z.array(lineaVista) }).optional(),
  })
  .superRefine((e, ctx) => {
    if (e.categoriaId === undefined) return;
    if (e.esperado === undefined)
      ctx.addIssue({ code: 'custom', path: ['esperado'], message: FALTA });
    if (e.recordarRegla !== undefined)
      ctx.addIssue({
        code: 'custom',
        path: ['recordarRegla'],
        message: 'No se recuerda la regla al arrastrar.',
      });
  });
export type EntradaOp37 = z.output<typeof op37>;

export const op39 = z.object({ movimientoId: uuid, accion: z.enum(['descartar', 'restaurar']) });
export type EntradaOp39 = z.output<typeof op39>;

export const op40 = z.discriminatedUnion('decision', [
  z.object({ ...APROBACION, decision: z.literal('confirmar_coincidencia') }),
  z.object({
    movimientoId: uuid,
    decision: z.enum(['rechazar_coincidencia', 'es_legitimo', 'es_duplicado']),
  }),
]);
export type EntradaOp40 = z.output<typeof op40>;

type Ref = { readonly id: Uuid; readonly nombre: string };

/** Lo que se aprobó según el servidor (04 §3.6, CP-15); la interfaz no lo toma de la fila que mostraba. */
export interface SalidaAprobacion {
  readonly transaccionId: Uuid;
  readonly aprobado: {
    readonly total: number;
    readonly comercio: string | null;
    readonly fecha: string;
    readonly cuenta: Ref;
    readonly destino:
      { readonly categoria: Ref } | { readonly deudor: Ref } | { readonly partes: number };
  };
}

export type SalidaMovimiento = {
  readonly movimientoId: Uuid;
  readonly estado: string;
} & Partial<SalidaAprobacion>;
