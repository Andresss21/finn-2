// Los campos de `/programadas/nueva` (FT-40, OP-42 crear): texto, como los escribe la persona (05 §4.2). De ellos sale la entrada de OP-42,
// con los tipos con destino y las partes del gasto. También la edición (TA-474). No calcula montos (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { programadas as t } from '../../textos/programadas';

export const TIPOS = ['gasto', 'pago_tarjeta', 'cuota_prestamo', 'aporte_inversion'] as const;
export const FRECUENCIAS = ['semanal', 'quincenal', 'mensual', 'anual', 'cada_n_dias'] as const;

export interface Parte {
  monto: string;
  categoriaId: string;
}

export interface Campos {
  tipo: (typeof TIPOS)[number];
  cuentaId: string;
  cuentaDestinoId: string;
  comercio: string;
  monto: string;
  tolerancia: string;
  frecuencia: (typeof FRECUENCIAS)[number];
  frecuenciaDias: string;
  primeraFecha: string;
  fechaFin: string;
  registroAutomatico: boolean;
  lineas: Parte[];
}

export const contrato: z.ZodType<Campos, Campos> = z
  .object({
    tipo: z.enum(TIPOS),
    cuentaId: z.string(),
    cuentaDestinoId: z.string(),
    comercio: z.string(),
    monto: z.string(),
    tolerancia: z.string(),
    frecuencia: z.enum(FRECUENCIAS),
    frecuenciaDias: z.string(),
    primeraFecha: z.string(),
    fechaFin: z.string(),
    registroAutomatico: z.boolean(),
    lineas: z.array(z.object({ monto: z.string(), categoriaId: z.string() })),
  })
  .superRefine((c, ctx) => {
    const falla = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const positivo = (texto: string, path: (string | number)[]): void => {
      const m = normalizarMontoEscrito(texto);
      if (m.estado !== 'valido') falla(path, t.obligatorio);
      else if (m.esCero) falla(path, t.montoMayorACero);
    };
    if (c.comercio.trim() === '') falla(['comercio'], t.obligatorio);
    if (c.cuentaId === '') falla(['cuentaId'], t.elegirCuenta);
    if (c.tipo !== 'gasto' && c.cuentaDestinoId === '') falla(['cuentaDestinoId'], t.elegirCuenta);
    positivo(c.monto, ['monto']);
    if (c.primeraFecha === '') falla(['primeraFecha'], t.obligatorio);
    if (c.frecuencia === 'cada_n_dias' && !/^[1-9]\d*$/.test(c.frecuenciaDias))
      falla(['frecuenciaDias'], t.obligatorio);
    if (c.tipo !== 'pago_tarjeta')
      c.lineas.forEach((l, i) => {
        if (l.categoriaId === '') falla(['lineas', i, 'categoriaId'], t.obligatorio);
        if (c.lineas.length > 1) positivo(l.monto, ['lineas', i, 'monto']);
      });
  });

const texto = (m: string): string => {
  const r = normalizarMontoEscrito(m);
  return r.estado === 'valido' ? r.texto : m;
};

/** Las partes que se envían: una sola lleva el monto total; solo un gasto puede tener varias; el pago de tarjeta no lleva. */
function lineasDe(c: Campos): { monto: string; categoriaId: string }[] {
  if (c.tipo === 'pago_tarjeta') return [];
  const una = c.tipo !== 'gasto' || c.lineas.length <= 1;
  return (una ? c.lineas.slice(0, 1) : c.lineas).map((l) => ({
    monto: texto(una ? c.monto : l.monto),
    categoriaId: l.categoriaId,
  }));
}

/** La entrada de OP-42 `crear`: los campos opcionales vacíos no se envían. */
export function entradaDeCreacion(c: Campos): Record<string, unknown> {
  return {
    accion: 'crear',
    tipo: c.tipo,
    cuentaId: c.cuentaId,
    ...(c.tipo === 'gasto' ? {} : { cuentaDestinoId: c.cuentaDestinoId }),
    comercio: c.comercio.trim(),
    monto: texto(c.monto),
    tolerancia: c.tolerancia.trim() === '' ? '0.00' : texto(c.tolerancia),
    frecuencia: c.frecuencia,
    ...(c.frecuencia === 'cada_n_dias' ? { frecuenciaDias: Number(c.frecuenciaDias) } : {}),
    primeraFecha: c.primeraFecha,
    ...(c.fechaFin.trim() === '' ? {} : { fechaFin: c.fechaFin.trim() }),
    registroAutomatico: c.registroAutomatico,
    ...(c.tipo === 'pago_tarjeta' ? {} : { lineas: lineasDe(c) }),
  };
}

const nuloSiVacio = (v: string): string | null => (v.trim() === '' ? null : v.trim());

/** Cada campo editable de OP-42 con su valor enviable (nulo si está vacío); sirve para comparar al editar y como `esperado`. */
export function valoresEnviables(c: Campos): Record<string, unknown> {
  return {
    cuentaId: c.cuentaId,
    cuentaDestinoId: c.tipo === 'gasto' ? null : nuloSiVacio(c.cuentaDestinoId),
    comercio: c.comercio.trim(),
    monto: texto(c.monto),
    tolerancia: c.tolerancia.trim() === '' ? '0.00' : texto(c.tolerancia),
    frecuencia: c.frecuencia,
    frecuenciaDias: c.frecuencia === 'cada_n_dias' ? Number(c.frecuenciaDias) : null,
    primeraFecha: c.primeraFecha,
    fechaFin: nuloSiVacio(c.fechaFin),
    registroAutomatico: c.registroAutomatico,
    lineas: lineasDe(c),
  };
}

/** La entrada de OP-42 `editar` con lo que cambió respecto de `base`; `undefined` si no cambió nada. El `esperado` lo agrega `useOperacion`. */
export function entradaDeEdicion(
  programadaId: string,
  base: Campos,
  c: Campos,
): Record<string, unknown> | undefined {
  const antes = valoresEnviables(base);
  const ahora = valoresEnviables(c);
  const cambios = Object.fromEntries(
    Object.keys(ahora).flatMap((k) =>
      JSON.stringify(ahora[k]) === JSON.stringify(antes[k]) ? [] : [[k, ahora[k]]],
    ),
  );
  return Object.keys(cambios).length === 0
    ? undefined
    : { accion: 'editar', programadaId, ...cambios };
}
