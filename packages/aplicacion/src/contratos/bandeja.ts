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

// ── OP-38, OP-41, OP-49 y OP-50 (04 §3.6)
/** OP-38 Aprobar todos: los movimientos que la lista mostró como elegibles y un id de transacción por cada uno. */
export const op38 = z
  .object({
    movimientoIds: z.array(uuid).min(1, { error: 'Elegí al menos un movimiento.' }).max(200),
    ids: z.record(z.uuid(), uuid),
  })
  .superRefine((e, ctx) => {
    for (const id of e.movimientoIds)
      if (e.ids[id] === undefined)
        ctx.addIssue({
          code: 'custom',
          path: ['ids', id],
          message: 'Falta el id de la transacción.',
        });
  });
export type EntradaOp38 = z.output<typeof op38>;

/** Un movimiento del lote (una escritura por elemento, RT-03): su movimiento y el id de su transacción. */
export const elementoOp38 = z.object({ movimientoId: uuid, id: uuid });
export type ElementoOp38 = z.output<typeof elementoOp38>;

/** Por qué un movimiento no se aprobó en lote (AV-19): el código y el mensaje de su rechazo (04 §3.0.6). */
export interface NoAprobado {
  readonly codigo: string;
  readonly mensaje: string;
}
export interface SalidaOp38 {
  readonly elementos: readonly {
    readonly movimientoId: Uuid;
    readonly resultado: 'aprobado' | 'ya_aplicada' | NoAprobado;
  }[];
}
/** La previsualización del lote: lo que cada movimiento haría, sin escribir. */
export interface VistaOp38 {
  readonly elementos: readonly {
    readonly movimientoId: Uuid;
    readonly aprobable: boolean;
    readonly motivo?: NoAprobado;
  }[];
}

export const CAMPOS_OP41 = ['patron', 'categoriaId'] as const;
const patronRegla = textoLimpio.max(100, { error: 'El patrón no puede pasar de 100 caracteres.' });

/** OP-41 Reglas de comercio: crear, editar (con lo que vio la interfaz en `esperado`) o eliminar. */
export const op41 = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('crear'), id: uuid, patron: patronRegla, categoriaId: uuid }),
  z
    .object({
      accion: z.literal('editar'),
      reglaId: uuid,
      patron: patronRegla.optional(),
      categoriaId: uuid.optional(),
      esperado: z.object({ patron: z.string().optional(), categoriaId: uuid.optional() }),
    })
    .superRefine((e, ctx) => {
      const cambios = CAMPOS_OP41.filter((k) => e[k] !== undefined);
      if (cambios.length === 0)
        ctx.addIssue({ code: 'custom', message: 'No hay nada que cambiar.' });
      for (const k of cambios)
        if (e.esperado[k] === undefined)
          ctx.addIssue({ code: 'custom', path: ['esperado', k], message: FALTA });
    }),
  z.object({ accion: z.literal('eliminar'), reglaId: uuid }),
]);
export type EntradaOp41 = z.output<typeof op41>;
export interface SalidaOp41 {
  readonly reglaId: Uuid;
}

/** OP-49 Reprocesar un SMS con error: `intentoVisto` es el último intento que vio la interfaz. */
export const op49 = z.object({ smsId: uuid, intentoVisto: z.number().int().min(0) });
export type EntradaOp49 = z.output<typeof op49>;
export interface SalidaOp49 {
  readonly smsId: Uuid;
  readonly movimientoId: Uuid;
  readonly estado: string;
  readonly intento: number;
}

/** OP-50 Crear la transacción a mano desde un SMS con error: la entrada de OP-37, sin la variante de CF-21. */
export const op50 = z.object(APROBACION);
export type EntradaOp50 = z.output<typeof op50>;
