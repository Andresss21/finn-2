// Los campos de `/bandeja/[movimientoId]` (FT-35): los de un gasto (FT-21) más el tipo. Los valores son texto, como los escribe la
// persona (05 §4.2). De ellos salen las entradas de OP-36 (solo lo que cambió, con lo que se vio en `esperado`) y de OP-37.
import * as z from 'zod';
import type { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal } from '../../formato';
import {
  contrato as contratoDeGasto,
  destinoDe,
  monto,
  parteVacia,
  type Campos as CamposDeGasto,
  type Parte,
} from '../registrar-gasto/campos';

export type Campos = CamposDeGasto & { readonly tipo: string };
export const contrato = z.intersection(
  z.object({ tipo: z.string() }),
  contratoDeGasto,
) as unknown as z.ZodType<Campos, Campos>;

/** `MovimientoDto.esperado` (04 §6.8): los valores vigentes del movimiento, en centavos. */
interface Esperado {
  readonly cuentaId: string | null;
  readonly fecha: string | null;
  readonly monto: number | null;
  readonly comercio: string | null;
  readonly tipoPropuesto: string | null;
  readonly nota: string | null;
  readonly lineas: readonly {
    readonly monto: number;
    readonly categoriaId: string | null;
    readonly deudorId: string | null;
  }[];
}

export function camposIniciales(esperado: Readonly<Record<string, unknown>>): Campos {
  const e = esperado as unknown as Esperado;
  const total = e.monto === null ? '' : centavosATextoDecimal(e.monto as Centavos);
  const partes: Parte[] = e.lineas.map((l) => ({
    monto: centavosATextoDecimal(l.monto as Centavos),
    destino: l.deudorId === null ? 'categoria' : 'por_cobrar',
    categoriaId: l.categoriaId ?? '',
    deudorId: l.deudorId ?? '',
    deudorNuevo: '',
  }));
  return {
    cuentaId: e.cuentaId ?? '',
    fecha: e.fecha ?? '',
    total,
    comercio: e.comercio ?? '',
    nota: e.nota ?? '',
    tipo: e.tipoPropuesto ?? '',
    lineas:
      partes.length === 0 && e.tipoPropuesto === 'gasto'
        ? [{ ...parteVacia(), monto: total }]
        : partes,
  };
}

const vacioANulo = (texto: string): string | null => (texto.trim() === '' ? null : texto.trim());

/** La entrada de OP-36 con lo que cambió respecto de `base`; `undefined` si no cambió nada. */
export function entradaDeEdicion(
  movimientoId: string,
  base: Campos,
  c: Campos,
  esperado: Readonly<Record<string, unknown>>,
): Record<string, unknown> | undefined {
  const cambios: Record<string, unknown> = {
    ...(c.cuentaId === base.cuentaId ? {} : { cuentaId: c.cuentaId }),
    ...(c.fecha === base.fecha ? {} : { fecha: c.fecha }),
    ...(c.total === base.total ? {} : { monto: monto(c.total) }),
    ...(c.comercio.trim() === base.comercio.trim() ? {} : { comercio: vacioANulo(c.comercio) }),
    ...(c.nota.trim() === base.nota.trim() ? {} : { nota: vacioANulo(c.nota) }),
    ...(c.tipo === base.tipo || c.tipo === '' ? {} : { tipoPropuesto: c.tipo }),
    ...(c.tipo !== 'gasto' || JSON.stringify(c.lineas) === JSON.stringify(base.lineas)
      ? {}
      : { lineas: c.lineas.map((l) => ({ monto: monto(l.monto), destino: destinoDe(l) })) }),
  };
  return Object.keys(cambios).length === 0 ? undefined : { movimientoId, ...cambios, esperado };
}

/** ¿Se ofrece «Recordar esta categoría»? Con una sola parte con categoría y un comercio (CA-35.4). */
export const ofreceRecordar = (c: Campos): boolean =>
  c.tipo === 'gasto' &&
  c.lineas.length === 1 &&
  c.lineas[0]?.destino === 'categoria' &&
  c.lineas[0].categoriaId !== '' &&
  c.comercio.trim() !== '';
