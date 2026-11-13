// Contratos de las operaciones de presupuesto y metas OP-14, OP-15, OP-17 y OP-18 (04 §3.3; BE-08). La salida de cada
// esquema ya es la entrada del dominio: montos en `Centavos`, fechas como `FechaLocal`. `revisionVista` y
// `huellaImpacto` los separa el marco antes de validar.
import * as z from 'zod';
import type { Uuid } from '@finn/dominio';
import type { Centavos } from '@finn/dominio/valores';
import { fechaLocal, montoTexto, montoTextoConSigno, revision, uuid } from './comunes.ts';

/** OP-14 Asignar o desasignar: `montoNuevo` puede ser negativo (supuesto 6); `esperado` es Asig(c, p) que vio la interfaz. */
export const op14 = z.object({
  categoriaId: uuid,
  periodoInicio: fechaLocal,
  montoNuevo: montoTextoConSigno,
  esperado: z.object({ monto: montoTextoConSigno }),
});
export type EntradaOp14 = z.output<typeof op14>;

/** OP-15 Mover dinero entre categorías: `esperado` trae las dos celdas Asig(o, p) y Asig(d, p). */
export const op15 = z.object({
  origenId: uuid,
  destinoId: uuid,
  periodoInicio: fechaLocal,
  monto: montoTexto,
  esperado: z.object({
    asignacionOrigen: montoTextoConSigno,
    asignacionDestino: montoTextoConSigno,
  }),
});
export type EntradaOp15 = z.output<typeof op15>;

/**
 * [CH-254] Salida de OP-15: Asig(o, p) y Asig(d, p) después de mover, leídas de los hechos. Son el `esperado` de la
 * inversa («Deshacer», E2-13): otra OP-15 con el mismo monto y el origen y el destino intercambiados.
 */
export interface SalidaOp15 {
  readonly asignacionOrigen: Centavos;
  readonly asignacionDestino: Centavos;
}

/**
 * OP-16 Asignación rápida: el dominio calcula el valor de la variante; `esperado.monto` es Asig(c, p) que vio la
 * interfaz (04 §3.3). Su idempotencia es la de OP-14.
 */
export const op16 = z.object({
  categoriaId: uuid,
  periodoInicio: fechaLocal,
  variante: z.enum([
    'falta_meta',
    'igual_periodo_anterior',
    'promedio_gasto',
    'cubrir_sobregiro',
    'reservar_falta', // CH-222: solo en pago(t), en el activo y con S(t) > 0
  ]),
  esperado: z.object({ monto: montoTextoConSigno }),
});
export type EntradaOp16 = z.output<typeof op16>;

/** OP-17 Auto-asignar: el resultado depende de todo el estado, así que lo esperado es la revisión vista. */
export const op17 = z.object({
  periodoInicio: fechaLocal,
  categorias: z.array(uuid).optional(),
  esperado: z.object({ revision }),
});
export type EntradaOp17 = z.output<typeof op17>;

const tipoMeta = z.enum(['mensual', 'semanal', 'anual', 'para_fecha']);
const modoDeMeta = z.enum(['acumular', 'rellenar_hasta']);

/**
 * OP-18 Crear, editar o eliminar una meta. La forma por tipo es la de `ck_metas_*` (03): modo en las de período. El modo de la
 * meta se llama `modoMeta` porque `modo` es el modo de envío de toda Server Action (04 §2.2.2, CH-80).
 */
export const op18 = z.discriminatedUnion('accion', [
  z
    .object({
      accion: z.literal('crear'),
      id: uuid,
      categoriaId: uuid,
      tipo: tipoMeta,
      modoMeta: modoDeMeta.optional(),
      monto: montoTexto,
      fechaObjetivo: fechaLocal.optional(),
    })
    .superRefine((e, ctx) => {
      const falla = (path: string, message: string): void => {
        ctx.addIssue({ code: 'custom', path: [path], message });
      };
      const porPeriodo = e.tipo === 'mensual' || e.tipo === 'semanal';
      if (e.monto <= 0) falla('monto', 'Ingresá un monto mayor que cero.');
      if (porPeriodo && e.modoMeta === undefined) falla('modoMeta', 'Elegí un modo.');
      if (!porPeriodo && e.modoMeta !== undefined) falla('modoMeta', 'Esta meta no tiene modo.');
      if (e.tipo === 'para_fecha' && e.fechaObjetivo === undefined)
        falla('fechaObjetivo', 'Ingresá una fecha objetivo.');
      if (porPeriodo && e.fechaObjetivo !== undefined)
        falla('fechaObjetivo', 'Esta meta no tiene fecha objetivo.');
    }),
  z
    .object({
      accion: z.literal('editar'),
      metaId: uuid,
      monto: montoTexto.optional(),
      modoMeta: modoDeMeta.optional(),
      fechaObjetivo: fechaLocal.optional(),
      // lo que vio la interfaz de cada campo que cambia; una anual sin fecha la trae como `null`
      esperado: z.object({
        monto: montoTexto.optional(),
        modoMeta: modoDeMeta.optional(),
        fechaObjetivo: fechaLocal.nullable().optional(),
      }),
    })
    .superRefine((e, ctx) => {
      const falla = (path: string[], message: string): void => {
        ctx.addIssue({ code: 'custom', path, message });
      };
      const pedidas = (['monto', 'modoMeta', 'fechaObjetivo'] as const).filter(
        (k) => e[k] !== undefined,
      );
      if (pedidas.length === 0) falla(['monto'], 'Indicá qué cambiar.');
      if (e.monto !== undefined && e.monto <= 0)
        falla(['monto'], 'Ingresá un monto mayor que cero.');
      for (const k of pedidas)
        if (e.esperado[k] === undefined) falla(['esperado', k], 'Falta el valor que viste.');
    }),
  z.object({ accion: z.literal('eliminar'), metaId: uuid }),
]);
export type EntradaOp18 = z.output<typeof op18>;

/** Salida de OP-18 al crear: el id de la meta; las demás no informan nada (04 §3.0.3). */
export interface SalidaPresupuesto {
  readonly id?: Uuid;
}
