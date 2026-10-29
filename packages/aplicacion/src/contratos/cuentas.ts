// Contratos de las operaciones de cuentas OP-01 a OP-06 (04 §3.1; BE-08). La salida de cada esquema ya es la
// entrada del dominio: montos en `Centavos`, fechas en `FechaLocal`, tasas en millonésimas (DB-13).
import * as z from 'zod';
import type { Uuid } from '@finn/dominio';
import { fechaLocal, montoTexto, montoTextoConSigno, textoLimpio, uuid } from './comunes.ts';

/** Porcentaje con hasta 4 decimales a millonésimas: `"12.7525"` → 127525 (DB-13); sin flotantes. */
const porcentaje = z
  .string({ error: 'Ingresá un porcentaje.' })
  .regex(/^\d{1,3}(\.\d{1,4})?$/, { error: 'Ingresá un porcentaje con hasta 4 decimales.' })
  .transform((t) => {
    const [entero = '0', decimales = ''] = t.split('.');
    return Number(entero) * 10_000 + Number(decimales.padEnd(4, '0'));
  });
const dia = z.number({ error: 'Ingresá un día.' }).int().min(1).max(31);
const entero = (minimo: number) => z.number({ error: 'Ingresá un número.' }).int().min(minimo);
const ultimos4 = z.string({ error: 'Ingresá cuatro dígitos.' }).regex(/^\d{4}$/, {
  error: 'Ingresá cuatro dígitos.',
});

const TARJETA = {
  limiteCredito: montoTexto,
  tasaAnual: porcentaje,
  diaCorte: dia,
  diaPago: dia,
  red: z.enum(['visa', 'mastercard', 'otra']),
  color: z.string().regex(/^#[0-9A-F]{6}$/, { error: 'Ingresá un color como #1A2B3C.' }),
};
const PRESTAMO = {
  contraparte: textoLimpio,
  montoOriginal: montoTexto,
  tasaNominalAnual: porcentaje,
  tipoTasa: z.enum(['fija', 'variable']),
  seguroPrimerMes: montoTexto,
  comision: montoTexto,
  frecuencia: z.enum(['semanal', 'quincenal', 'mensual', 'anual', 'cada_n_dias']),
  frecuenciaDias: entero(1),
  cuotaPactada: montoTexto,
  plazoCuotas: entero(1),
  modeloCalculo: z.enum(['banco_agricola']),
  cuotasPagadasAlCrear: entero(0),
};
const INVERSION = { rendimientoAnualEsperado: porcentaje };
const GENERALES = { nombre: textoLimpio, institucionId: uuid, ultimos4, fechaApertura: fechaLocal };

/** Coherencia de un préstamo (03 §3.6): `frecuenciaDias` solo con `cada_n_dias`; pagadas ≤ plazo. */
function coherentePrestamo(
  p: {
    frecuencia: string;
    frecuenciaDias?: number | undefined;
    plazoCuotas: number;
    cuotasPagadasAlCrear: number;
  },
  ctx: z.RefinementCtx,
): void {
  const falla = (path: string, message: string): void => {
    ctx.addIssue({ code: 'custom', path: [path], message });
  };
  if ((p.frecuencia === 'cada_n_dias') !== (p.frecuenciaDias !== undefined))
    falla('frecuenciaDias', 'Indicá los días solo cuando la frecuencia es cada N días.');
  if (p.cuotasPagadasAlCrear > p.plazoCuotas)
    falla('cuotasPagadasAlCrear', 'Las cuotas pagadas no pueden pasar del plazo.');
}

const comunes = {
  id: uuid,
  nombre: GENERALES.nombre,
  institucionId: uuid.optional(),
  ultimos4: ultimos4.optional(),
  fechaApertura: fechaLocal.optional(),
};

/** OP-01 Crear cuenta. En una tarjeta, `saldo` es la deuda (positivo = debe). */
export const op01 = z.discriminatedUnion('tipo', [
  z.object({ ...comunes, tipo: z.literal('efectivo'), saldo: montoTextoConSigno }),
  z.object({
    ...comunes,
    tipo: z.literal('tarjeta'),
    saldo: montoTextoConSigno,
    limiteCredito: TARJETA.limiteCredito,
    tasaAnual: TARJETA.tasaAnual.optional(),
    diaCorte: TARJETA.diaCorte,
    diaPago: TARJETA.diaPago,
    red: TARJETA.red.optional(),
    color: TARJETA.color.optional(),
  }),
  z
    .object({
      ...comunes,
      tipo: z.literal('prestamo'),
      saldo: montoTexto,
      contraparte: PRESTAMO.contraparte,
      montoOriginal: PRESTAMO.montoOriginal,
      tasaNominalAnual: PRESTAMO.tasaNominalAnual.optional(),
      tipoTasa: PRESTAMO.tipoTasa,
      seguroPrimerMes: PRESTAMO.seguroPrimerMes.optional(),
      comision: PRESTAMO.comision.optional(),
      frecuencia: PRESTAMO.frecuencia,
      frecuenciaDias: PRESTAMO.frecuenciaDias.optional(),
      cuotaPactada: PRESTAMO.cuotaPactada,
      plazoCuotas: PRESTAMO.plazoCuotas,
      modeloCalculo: PRESTAMO.modeloCalculo.optional(),
      cuotasPagadasAlCrear: PRESTAMO.cuotasPagadasAlCrear,
    })
    .superRefine(coherentePrestamo),
  z.object({
    ...comunes,
    tipo: z.literal('inversion'),
    saldo: montoTexto,
    rendimientoAnualEsperado: INVERSION.rendimientoAnualEsperado.optional(),
  }),
]);
export type EntradaOp01 = z.output<typeof op01>;

const EDITABLES = { ...GENERALES, ...TARJETA, ...PRESTAMO, ...INVERSION };
type Editables = typeof EDITABLES;

/** Cada campo del esquema como opcional; con `nulos`, `null` significa "la interfaz no vio valor" (4.6.2). */
function opcionales<F extends Record<string, z.ZodType>>(forma: F, nulos: boolean) {
  const campos = Object.entries(forma).map(([k, s]) => [k, (nulos ? s.nullable() : s).optional()]);
  return Object.fromEntries(campos) as {
    [K in keyof F]: z.ZodOptional<F[K]> | z.ZodOptional<z.ZodNullable<F[K]>>;
  };
}

/** OP-02 Editar cuenta: los campos que cambian y, de cada uno, el valor que vio la interfaz (4.6.2). */
export const op02 = z
  .object({
    cuentaId: uuid,
    ...(opcionales(EDITABLES, false) as { [K in keyof Editables]: z.ZodOptional<Editables[K]> }),
    esperado: z.object(
      opcionales(EDITABLES, true) as {
        [K in keyof Editables]: z.ZodOptional<z.ZodNullable<Editables[K]>>;
      },
    ),
  })
  .superRefine((e, ctx) => {
    for (const [k, v] of Object.entries(e))
      if (k in EDITABLES && v !== undefined && e.esperado[k as keyof Editables] === undefined)
        ctx.addIssue({
          code: 'custom',
          path: ['esperado', k],
          message: 'Falta el valor que viste.',
        });
  });
export type EntradaOp02 = z.output<typeof op02>;

/** OP-03 Reordenar cuentas: todas las abiertas, en el orden nuevo. */
export const op03 = z.object({ orden: z.array(uuid) });
export type EntradaOp03 = z.output<typeof op03>;

/** OP-04 Archivar cuenta; `devolverAsignacionesFuturas` solo importa en una tarjeta. */
export const op04 = z.object({
  cuentaId: uuid,
  devolverAsignacionesFuturas: z.boolean().optional(),
});
export type EntradaOp04 = z.output<typeof op04>;

/** OP-05 Desarchivar cuenta y OP-06 Eliminar cuenta. */
export const op05 = z.object({ cuentaId: uuid });
export const op06 = z.object({ cuentaId: uuid });
export type EntradaCuenta = z.output<typeof op05>;

/** Salida común (04 §3.0.3): `id` solo si la operación crea el hecho principal. */
export interface SalidaCuenta {
  readonly id?: Uuid;
}

export const CLAVES_GENERALES = Object.keys(GENERALES);
export const CLAVES_EDITABLES = Object.keys(EDITABLES);
