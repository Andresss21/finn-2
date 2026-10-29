// Parámetros de las consultas (04 §6.0.1, §6.2, §6.4), validados con Zod. Un parámetro inválido es `VALIDACION`
// (la consulta lo lanza como `ExcepcionFinn`). Las fechas llegan como texto `AAAA-MM-DD` y se entregan como `FechaLocal`.
import * as z from 'zod';
import { FechaLocal } from '@finn/dominio/valores';
import { montoTexto, uuid } from './comunes.ts';

const fechaLocal = z
  .string({ error: 'Ingresá una fecha.' })
  .refine(
    (t) => {
      try {
        FechaLocal.desdeTexto(t);
        return true;
      } catch {
        return false;
      }
    },
    { error: 'La fecha no es válida.' },
  )
  .transform((t) => FechaLocal.desdeTexto(t));

/** `consultas.inicio()` no recibe parámetros (04 §6.1). */
export const sinParametros = z.undefined();

/** `consultas.presupuesto({ periodoInicio?, filtro? })`: por defecto, el período activo y `todas` (04 §6.2). */
export const parametrosPresupuesto = z.object({
  periodoInicio: fechaLocal.optional(),
  filtro: z.enum(['todas', 'sobregiradas', 'sin_fondos', 'cubiertas']).optional(),
});

/** `consultas.detalleLpa({ periodos? })`: por defecto 12, máximo 60 (04 §6.4). */
export const parametrosDetalleLpa = z.object({
  periodos: z
    .number({ error: 'Los períodos deben ser un número.' })
    .int({ error: 'Los períodos deben ser un entero.' })
    .min(1, { error: 'Pedí al menos un período.' })
    .max(60, { error: 'Podés pedir hasta 60 períodos.' })
    .optional(),
});

/** `consultas.detalleCategoria({ categoriaId, periodoInicio? })`: por defecto, el período activo (04 §6.3). */
export const parametrosDetalleCategoria = z.object({
  categoriaId: z.uuid({ error: 'La categoría no es válida.' }),
  periodoInicio: fechaLocal.optional(),
});

/** `consultas.bandeja({ vista?, cursor? })`: por defecto, los activos (04 §6.8). */
export const parametrosBandeja = z.object({
  vista: z.enum(['activos', 'descartados']).optional(),
  cursor: z.string().min(1, { error: 'El cursor no es válido.' }).optional(),
});

/** `consultas.sugerencia({ comercio })`: texto libre del usuario (04 §6.14.3). */
export const parametrosSugerencia = z.object({
  comercio: z
    .string({ error: 'Ingresá un comercio.' })
    .trim()
    .min(1, { error: 'Ingresá un comercio.' })
    .max(200, { error: 'El comercio es demasiado largo.' }),
});

export type ParametrosDetalleCategoria = z.output<typeof parametrosDetalleCategoria>;
export type ParametrosPresupuesto = z.output<typeof parametrosPresupuesto>;
export type ParametrosDetalleLpa = z.output<typeof parametrosDetalleLpa>;

const tipo = z.enum(
  [
    'gasto',
    'ingreso',
    'saldo_inicial',
    'transferencia',
    'pago_tarjeta',
    'cuota_prestamo',
    'abono_capital',
    'aporte_inversion',
    'desembolso_prestamo',
    'retiro_inversion',
    'avance_efectivo',
    'entrada_tarjeta',
    'transferencia_tarjetas',
    'cobro',
    'devolucion',
    'ajuste_inversion',
  ],
  { error: 'El tipo no es válido.' },
);
const estado = z.enum(['pendiente', 'confirmada', 'conciliada'], {
  error: 'El estado no es válido.',
});
const cursor = z
  .string({ error: 'El cursor no es válido.' })
  .min(1, { error: 'El cursor no es válido.' });
const limite = z
  .number({ error: 'El límite debe ser un número.' })
  .int({ error: 'El límite debe ser un entero.' })
  .min(1, { error: 'Pedí al menos una fila.' })
  .max(100, { error: 'Podés pedir hasta 100 filas.' });

/** `consultas.cuentas({ incluirArchivadas? })` (04 §6.5). */
export const parametrosCuentas = z.object({ incluirArchivadas: z.boolean().optional() });

/** `consultas.detalleCuenta({ cuentaId, periodoInicio?, tipo?, estado?, cursor?, limite? })` (04 §6.6). */
export const parametrosDetalleCuenta = z.object({
  cuentaId: uuid,
  periodoInicio: fechaLocal.optional(),
  tipo: tipo.optional(),
  estado: estado.optional(),
  cursor: cursor.optional(),
  limite: limite.optional(),
});

/** `consultas.actividad({ texto?, montoDesde?, montoHasta?, categoriaId?, cuentaId?, desde?, hasta?, estado?, tipo?, origen?, cursor?, limite? })` (04 §6.7.1). */
export const parametrosActividad = z.object({
  texto: z
    .string({ error: 'El texto no es válido.' })
    .min(1, { error: 'Ingresá un texto.' })
    .optional(),
  montoDesde: montoTexto.optional(),
  montoHasta: montoTexto.optional(),
  categoriaId: uuid.optional(),
  cuentaId: uuid.optional(),
  desde: fechaLocal.optional(),
  hasta: fechaLocal.optional(),
  estado: estado.optional(),
  tipo: tipo.optional(),
  origen: z
    .enum(['sms', 'manual', 'importada', 'programada'], { error: 'El origen no es válido.' })
    .optional(),
  cursor: cursor.optional(),
  limite: limite.optional(),
});

/** `consultas.detalleTransaccion({ transaccionId })` (04 §6.7.2). */
export const parametrosDetalleTransaccion = z.object({ transaccionId: uuid });

const tipoCuenta = z.enum(['efectivo', 'tarjeta', 'prestamo', 'inversion'], {
  error: 'El tipo de cuenta no es válido.',
});
const tipoRegistro = z.enum(
  [
    'gasto',
    'ingreso',
    'transferencia',
    'devolucion_sin_compra',
    'aporte_inversion',
    'retiro_inversion',
    'ajuste_inversion',
    'desembolso',
    'avance',
    'entrada_tarjeta',
    'transferencia_deuda',
  ],
  { error: 'El tipo de registro no es válido.' },
);

/**
 * `consultas.formulario(parametros)` (04 §6.14.1), con las operaciones de registro y edición: registrar,
 * pagar_tarjeta, cuota_prestamo, editar_transaccion y cuenta. Las demás suman su caso con su tarea.
 */
export const parametrosFormulario = z.discriminatedUnion(
  'operacion',
  [
    z.object({ operacion: z.literal('registrar'), tipo: tipoRegistro, cuentaId: uuid.optional() }),
    z.object({ operacion: z.literal('pagar_tarjeta'), tarjetaId: uuid.optional() }),
    z.object({
      operacion: z.literal('cuota_prestamo'),
      prestamoId: uuid,
      modalidad: z.enum(['cuota', 'abono'], { error: 'La modalidad no es válida.' }),
      fecha: fechaLocal.optional(),
    }),
    z.object({ operacion: z.literal('editar_transaccion'), transaccionId: uuid }),
    z.object({
      operacion: z.literal('cuenta'),
      cuentaId: uuid.optional(),
      tipo: tipoCuenta.optional(),
    }),
  ],
  { error: 'La operación del formulario no es válida.' },
);
export type ParametrosFormulario = z.output<typeof parametrosFormulario>;
