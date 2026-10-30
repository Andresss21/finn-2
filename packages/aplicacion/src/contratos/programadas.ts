// Contratos de OP-42 (crear, editar, activar), OP-43, OP-44 y OP-51 (04 §3.7; BE-08). La salida de cada esquema ya es la
// entrada del dominio. Lo que el dominio trata como error de programación (calendario mal formado, partes que no
// corresponden al tipo) se rechaza aquí como `VALIDACION` (04 §7.6).
import * as z from 'zod';
import type { Uuid } from '@finn/dominio';
import { fechaLocal, montoTexto, textoLimpio, uuid } from './comunes.ts';
import { montoPositivo } from './transacciones.ts';

const tipo = z.enum(['gasto', 'pago_tarjeta', 'cuota_prestamo', 'aporte_inversion']);
const frecuencia = z.enum(['semanal', 'quincenal', 'mensual', 'anual', 'cada_n_dias']);
const dias = z.number({ error: 'Ingresá un número.' }).int().min(1, { error: 'Ingresá los días.' });
const lineas = z
  .array(z.object({ monto: montoPositivo, categoriaId: uuid }))
  .min(1, { error: 'Agregá al menos una parte.' })
  .max(20, { error: 'Máximo 20 partes.' });
/** Los campos que OP-42 edita; lo nulo es lo que la programada puede no tener. */
const CAMPOS = {
  cuentaId: uuid,
  cuentaDestinoId: uuid.nullable().optional(),
  comercio: textoLimpio,
  monto: montoPositivo,
  tolerancia: montoTexto,
  frecuencia,
  frecuenciaDias: dias.nullable().optional(),
  primeraFecha: fechaLocal,
  fechaFin: fechaLocal.nullable().optional(),
  registroAutomatico: z.boolean({ error: 'Elegí una opción.' }),
  lineas,
};
export const CAMPOS_EDITABLES = Object.keys(CAMPOS) as (keyof typeof CAMPOS)[];

/** La forma de 03 §4.5.4 y DB-16: `frecuenciaDias` solo en `cada_n_dias`, un destino salvo en el gasto y las partes del tipo. */
export function erroresDeForma(e: {
  tipo: z.output<typeof tipo>;
  frecuencia: z.output<typeof frecuencia>;
  frecuenciaDias?: number | null | undefined;
  primeraFecha: string;
  fechaFin?: string | null | undefined;
  cuentaDestinoId?: string | null | undefined;
  lineas?: readonly unknown[] | undefined;
}): readonly (readonly [campo: string, mensaje: string])[] {
  const n = e.lineas?.length ?? 0;
  const partes = e.tipo === 'pago_tarjeta' ? n === 0 : e.tipo === 'gasto' ? n > 0 : n === 1;
  const reglas: readonly (readonly [mal: boolean, campo: string, mensaje: string])[] = [
    [
      (e.frecuencia === 'cada_n_dias') !== (e.frecuenciaDias != null),
      'frecuenciaDias',
      'Indicá los días, solo si se repite cada N días.',
    ],
    [
      e.fechaFin != null && e.fechaFin < e.primeraFecha,
      'fechaFin',
      'La fecha de fin no puede ser anterior al inicio.',
    ],
    [
      (e.tipo === 'gasto') !== (e.cuentaDestinoId == null),
      'cuentaDestinoId',
      'Elegí la cuenta de destino (salvo en un gasto).',
    ],
    [!partes, 'lineas', 'Las partes no corresponden al tipo de transacción.'],
  ];
  return reglas.filter(([mal]) => mal).map(([, campo, mensaje]) => [campo, mensaje]);
}

const crear = z
  .object({
    accion: z.literal('crear'),
    id: uuid,
    tipo,
    ...CAMPOS,
    tolerancia: CAMPOS.tolerancia.optional(),
    lineas: lineas.optional(),
  })
  .superRefine((e, ctx) => {
    for (const [campo, message] of erroresDeForma(e))
      ctx.addIssue({ code: 'custom', path: [campo], message });
  });

const editar = z
  .object({
    accion: z.literal('editar'),
    programadaId: uuid,
    ...z.object(CAMPOS).partial().shape,
    esperado: z.object(CAMPOS).partial(), // lo que vio la interfaz de cada campo que cambia (4.6.2)
  })
  .superRefine((e, ctx) => {
    const pedidos = CAMPOS_EDITABLES.filter((k) => e[k] !== undefined);
    if (pedidos.length === 0)
      ctx.addIssue({ code: 'custom', path: ['comercio'], message: 'Indicá qué cambiar.' });
    for (const k of pedidos)
      if (e.esperado[k] === undefined)
        ctx.addIssue({
          code: 'custom',
          path: ['esperado', k],
          message: 'Falta el valor que viste.',
        });
  });

const activar = z.object({
  accion: z.literal('activar'),
  programadaId: uuid,
  activa: z.boolean({ error: 'Elegí una opción.' }),
});

/** OP-42: crear (clase creación), editar (valor absoluto) o activar y desactivar (natural). */
export const op42 = z.discriminatedUnion('accion', [crear, editar, activar]);
export type EntradaOp42 = z.output<typeof op42>;

/** OP-43 de un toque: los campos editables de la operación de su tipo; `id` es el de la transacción que se crea. */
export const op43 = z.object({
  id: uuid,
  programadaId: uuid,
  fechaEsperada: fechaLocal,
  monto: montoPositivo.optional(),
  lineas: lineas.optional(),
  desglose: z.object({ capital: montoTexto, interes: montoTexto, seguro: montoTexto }).optional(),
});
export type EntradaOp43 = z.output<typeof op43>;

export const op44 = z.object({ programadaId: uuid, fechaEsperada: fechaLocal });
export type EntradaOp44 = z.output<typeof op44>;

export const op51 = z.object({ programadaId: uuid });
export type EntradaOp51 = z.output<typeof op51>;

/** Salida de las operaciones de programadas: el id de lo que se creó (la programada), si lo hay. */
export interface SalidaProgramada {
  readonly id?: Uuid;
}
