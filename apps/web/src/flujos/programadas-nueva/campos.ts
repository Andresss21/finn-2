// Los campos de `/programadas/nueva` (FT-40, OP-42 crear): texto, como los escribe la persona (05 §4.2). De ellos sale la entrada de OP-42.
// Esta parte crea un gasto con una categoría; los tipos con destino y las partes son de TA-473. No calcula montos (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { programadas as t } from '../../textos/programadas';

export const FRECUENCIAS = ['semanal', 'quincenal', 'mensual', 'anual', 'cada_n_dias'] as const;

export interface Campos {
  cuentaId: string;
  comercio: string;
  monto: string;
  tolerancia: string;
  categoriaId: string;
  frecuencia: (typeof FRECUENCIAS)[number];
  frecuenciaDias: string;
  primeraFecha: string;
  fechaFin: string;
  registroAutomatico: boolean;
}

export const contrato: z.ZodType<Campos, Campos> = z
  .object({
    cuentaId: z.string(),
    comercio: z.string(),
    monto: z.string(),
    tolerancia: z.string(),
    categoriaId: z.string(),
    frecuencia: z.enum(FRECUENCIAS),
    frecuenciaDias: z.string(),
    primeraFecha: z.string(),
    fechaFin: z.string(),
    registroAutomatico: z.boolean(),
  })
  .superRefine((c, ctx) => {
    const falla = (path: string, message: string): void => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    const m = normalizarMontoEscrito(c.monto);
    if (c.comercio.trim() === '') falla('comercio', t.obligatorio);
    if (c.cuentaId === '') falla('cuentaId', t.elegirCuenta);
    if (c.categoriaId === '') falla('categoriaId', t.obligatorio);
    if (m.estado !== 'valido') falla('monto', t.obligatorio);
    else if (m.esCero) falla('monto', t.montoMayorACero);
    if (c.primeraFecha === '') falla('primeraFecha', t.obligatorio);
    if (c.frecuencia === 'cada_n_dias' && !/^[1-9]\d*$/.test(c.frecuenciaDias))
      falla('frecuenciaDias', t.obligatorio);
  });

const texto = (m: string): string => {
  const r = normalizarMontoEscrito(m);
  return r.estado === 'valido' ? r.texto : m;
};

/** La entrada de OP-42 `crear`: los campos opcionales vacíos no se envían. */
export function entradaDeCreacion(c: Campos): Record<string, unknown> {
  return {
    accion: 'crear',
    tipo: 'gasto',
    cuentaId: c.cuentaId,
    comercio: c.comercio.trim(),
    monto: texto(c.monto),
    tolerancia: c.tolerancia.trim() === '' ? '0.00' : texto(c.tolerancia),
    frecuencia: c.frecuencia,
    ...(c.frecuencia === 'cada_n_dias' ? { frecuenciaDias: Number(c.frecuenciaDias) } : {}),
    primeraFecha: c.primeraFecha,
    ...(c.fechaFin.trim() === '' ? {} : { fechaFin: c.fechaFin.trim() }),
    registroAutomatico: c.registroAutomatico,
    lineas: [{ monto: texto(c.monto), categoriaId: c.categoriaId }],
  };
}
