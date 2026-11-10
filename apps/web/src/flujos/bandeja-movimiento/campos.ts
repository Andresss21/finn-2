// Los campos de `/bandeja/[movimientoId]` (FT-35): los de un gasto (FT-21) más el tipo. Los valores son texto, como los escribe la
// persona (05 §4.2). De ellos salen las entradas de OP-36 (solo lo que cambió, con lo que se vio en `esperado`) y de OP-37.
import * as z from 'zod';
import type { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal, formatearFechaTexto, formatearMonto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { bandeja as t } from '../../textos/bandeja';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import {
  contrato as contratoDeGasto,
  destinoDe,
  monto,
  parteVacia,
  type Campos as CamposDeGasto,
  type Parte,
} from '../registrar-gasto/campos';

/** Una parte de la devolución sobre una línea de la compra elegida (CH-226): su nombre y lo que queda, ya formateados del DTO. */
export interface Devuelta {
  readonly lineaOriginalId: string;
  readonly nombre: string;
  readonly queda: string;
  readonly monto: string;
}

/**
 * Además de los de un gasto: el tipo, el origen de un pago de tarjeta (BE-41) y, en una devolución, la compra elegida con el
 * reparto sobre sus líneas (CH-226). Sin compra, la devolución lleva las partes a categoría (OP-33b).
 */
export type Campos = CamposDeGasto & {
  readonly tipo: string;
  // Solo de Revisar: «Editar transacción» (FT-25) comparte el resto de los campos y el contrato
  readonly origenId?: string;
  readonly compraId?: string;
  readonly compraNombre?: string;
  readonly devueltas?: Devuelta[];
};

const montoOVacio = (s: string): boolean =>
  /^[0.,\s]*$/.test(s) || normalizarMontoEscrito(s).estado === 'valido';

export const contrato = z.intersection(
  z
    .object({
      tipo: z.string(),
      origenId: z.string().optional(),
      compraId: z.string().optional(),
      compraNombre: z.string().optional(),
      devueltas: z
        .array(
          z.object({
            lineaOriginalId: z.string(),
            nombre: z.string(),
            queda: z.string(),
            monto: z.string(),
          }),
        )
        .optional(),
    })
    .superRefine((c, ctx) => {
      if (c.tipo === 'pago_tarjeta' && c.origenId === '')
        ctx.addIssue({ code: 'custom', path: ['origenId'], message: t.revisar.elegirOrigen });
      (c.devueltas ?? []).forEach((d, i) => {
        if (!montoOVacio(d.monto))
          ctx.addIssue({ code: 'custom', path: ['devueltas', i, 'monto'], message: g.completar });
      });
    }),
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
    readonly lineaOriginalId?: string | null;
  }[];
}

/** Los campos con que abre el flujo; `origenId` es el origen propuesto de un pago de tarjeta (BE-41), preseleccionado. */
export function camposIniciales(
  esperado: Readonly<Record<string, unknown>>,
  origenId = '',
): Campos {
  const e = esperado as unknown as Esperado;
  const total = e.monto === null ? '' : centavosATextoDecimal(e.monto as Centavos);
  // Las líneas que ya van sobre una compra son de la devolución; la compra la deduce el servidor de ellas (OP-37)
  const devueltas: Devuelta[] = e.lineas.flatMap((l) =>
    l.lineaOriginalId == null
      ? []
      : [
          {
            lineaOriginalId: l.lineaOriginalId,
            nombre: '',
            queda: '',
            monto: centavosATextoDecimal(l.monto as Centavos),
          },
        ],
  );
  const partes: Parte[] = e.lineas
    .flatMap((l) => (l.lineaOriginalId == null ? [l] : []))
    .map((l) => ({
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
    origenId,
    compraId: '',
    compraNombre: '',
    devueltas,
  };
}

/** ¿Hay una compra elegida para la devolución? */
export const conCompra = (c: Campos): c is Campos & { readonly compraId: string } =>
  c.compraId !== undefined && c.compraId !== '';

/** Las líneas de OP-36 según el tipo: las partes de un gasto o de una devolución sin compra, o el reparto sobre la compra. */
function lineasDe(c: Campos): Record<string, unknown>[] | undefined {
  if (c.tipo === 'devolucion' && conCompra(c))
    return (c.devueltas ?? [])
      .filter((d) => !/^[0.,\s]*$/.test(d.monto))
      .map((d) => ({ monto: monto(d.monto), destino: { lineaOriginalId: d.lineaOriginalId } }));
  if (c.tipo !== 'gasto' && c.tipo !== 'devolucion') return undefined;
  return c.lineas.map((l) => ({ monto: monto(l.monto), destino: destinoDe(l) }));
}

/** Una compra para elegir en una devolución (CH-226), ya formateada: el comercio y «fecha · cuenta · Queda $X». */
export interface CompraCandidata {
  readonly id: string;
  readonly titulo: string;
  readonly detalle: string;
}
/** Una candidata de `formulario('devolver')` o del contexto del movimiento (04 §6.14.4). */
export interface CandidataDto {
  readonly transaccionId: string;
  readonly fecha: string;
  readonly comercio: string | null;
  readonly cuenta: { readonly nombre: string };
  readonly restante: number;
}
export const aCandidata = (c: CandidataDto): CompraCandidata => ({
  id: c.transaccionId,
  titulo: c.comercio ?? t.revisar.compraSinComercio,
  detalle: t.revisar.compraDe(
    formatearFechaTexto(c.fecha),
    c.cuenta.nombre,
    formatearMonto(c.restante as Centavos),
  ),
});

/** Lo que OP-37 agrega según el tipo: el origen de un pago (BE-41) o la compra de una devolución (CH-226). */
export const extrasDeAprobar = (c: Campos): Record<string, string> => ({
  ...(c.tipo === 'pago_tarjeta' && c.origenId ? { origenId: c.origenId } : {}),
  ...(c.tipo === 'devolucion' && conCompra(c) ? { transaccionOriginalId: c.compraId } : {}),
});

/** FT-78: el movimiento con su única línea hacia la categoría que se soltó; lo demás queda como estaba. */
export function conCategoriaSoltada(c: Campos, categoriaId: string): Campos {
  if (c.tipo !== 'gasto' || c.lineas.length > 1) return c;
  const parte = c.lineas[0] ?? { ...parteVacia(), monto: c.total };
  return {
    ...c,
    lineas: [{ ...parte, destino: 'categoria', categoriaId, deudorId: '', deudorNuevo: '' }],
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
  const lineas = lineasDe(c);
  const cambios: Record<string, unknown> = {
    ...(c.cuentaId === base.cuentaId ? {} : { cuentaId: c.cuentaId }),
    ...(c.fecha === base.fecha ? {} : { fecha: c.fecha }),
    ...(c.total === base.total ? {} : { monto: monto(c.total) }),
    ...(c.comercio.trim() === base.comercio.trim() ? {} : { comercio: vacioANulo(c.comercio) }),
    ...(c.nota.trim() === base.nota.trim() ? {} : { nota: vacioANulo(c.nota) }),
    ...(c.tipo === base.tipo || c.tipo === '' ? {} : { tipoPropuesto: c.tipo }),
    ...(lineas === undefined || JSON.stringify(lineas) === JSON.stringify(lineasDe(base))
      ? {}
      : { lineas }),
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
