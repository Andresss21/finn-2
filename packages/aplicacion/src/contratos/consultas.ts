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
