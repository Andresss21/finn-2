// Parámetros de las consultas (04 §6.0.1, §6.2, §6.4), validados con Zod. Un parámetro inválido es `VALIDACION`
// (la consulta lo lanza como `ExcepcionFinn`). Las fechas llegan como texto `AAAA-MM-DD` y se entregan como `FechaLocal`.
import * as z from 'zod';
import { FechaLocal } from '@finn/dominio/valores';

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

export type ParametrosPresupuesto = z.output<typeof parametrosPresupuesto>;
export type ParametrosDetalleLpa = z.output<typeof parametrosDetalleLpa>;
