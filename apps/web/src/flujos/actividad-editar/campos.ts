// Los campos de `/actividad/[transaccionId]/editar` (FT-25, OP-28): los de la edición de un movimiento (FT-35) con los valores de la
// transacción. Son texto, como los escribe la persona (05 §4.2). De ellos sale la entrada de OP-28: solo lo que cambió, cada campo con
// el valor que se vio en `esperado` (04 §4.6.2). La parte lleva su `lineaId` para que el servidor la reconozca (CB-03).
import type { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal } from '../../formato';
import { destinoDe, monto, type Parte } from '../registrar-gasto/campos';
import type { Campos } from '../bandeja-movimiento/campos';

export { contrato, type Campos } from '../bandeja-movimiento/campos';

/** Lo que `detalleTransaccion()` dice de la transacción y esta edición usa. */
export interface DatosDeTransaccion {
  readonly transaccion: {
    readonly fecha: string;
    readonly tipo: string;
    readonly comercio: string | null;
    readonly total: number;
    readonly nota: string | null;
  };
  readonly efectos: readonly { readonly cuenta: { readonly id: string } }[];
  readonly lineas: readonly {
    readonly id: string;
    readonly monto: number;
    /** `{ categoria: Ref }`, `{ deudor: Ref }` o `{ lineaOriginal }` (04 §6.7.2). */
    readonly destino: Readonly<Record<string, { readonly id: string } | undefined>>;
  }[];
}

type ParteConLinea = Parte & { readonly lineaId?: string };
const lineaIdDe = (p: Parte): string | undefined => (p as ParteConLinea).lineaId;

export function camposIniciales(d: DatosDeTransaccion): Campos {
  const { transaccion: t } = d;
  const lineas: ParteConLinea[] =
    t.tipo !== 'gasto'
      ? []
      : d.lineas.map((l) => ({
          lineaId: l.id,
          monto: centavosATextoDecimal(l.monto as Centavos),
          destino: l.destino['deudor'] === undefined ? 'categoria' : 'por_cobrar',
          categoriaId: l.destino['categoria']?.id ?? '',
          deudorId: l.destino['deudor']?.id ?? '',
          deudorNuevo: '',
        }));
  return {
    cuentaId: d.efectos[0]?.cuenta.id ?? '',
    fecha: t.fecha,
    total: centavosATextoDecimal(t.total as Centavos),
    comercio: t.comercio ?? '',
    nota: t.nota ?? '',
    tipo: t.tipo,
    lineas,
  };
}

const vacioANulo = (texto: string): string | null => (texto.trim() === '' ? null : texto.trim());

/** La entrada de OP-28 con lo que cambió respecto de `base`; `undefined` si no cambió nada. `visto` pisa lo que se vio de `base`. */
export function entradaDeEdicion(
  transaccionId: string,
  base: Campos,
  c: Campos,
  visto: Partial<Record<string, unknown>> = {},
): Record<string, unknown> | undefined {
  const lineasCambiaron =
    c.tipo === 'gasto' &&
    JSON.stringify(c.lineas.map((l) => [l.monto, destinoDe(l)])) !==
      JSON.stringify(base.lineas.map((l) => [l.monto, destinoDe(l)]));
  const cambios: Record<string, unknown> = {
    ...(c.cuentaId === base.cuentaId ? {} : { cuentaId: c.cuentaId }),
    ...(c.fecha === base.fecha ? {} : { fecha: c.fecha }),
    ...(c.total === base.total ? {} : { total: monto(c.total) }),
    ...(c.comercio.trim() === base.comercio.trim() ? {} : { comercio: vacioANulo(c.comercio) }),
    ...(c.nota.trim() === base.nota.trim() ? {} : { nota: vacioANulo(c.nota) }),
    ...(lineasCambiaron
      ? {
          lineas: c.lineas.map((l) => ({
            ...(lineaIdDe(l) ? { lineaId: lineaIdDe(l) } : {}),
            monto: monto(l.monto),
            destino: destinoDe(l),
          })),
        }
      : {}),
  };
  const claves = Object.keys(cambios);
  if (claves.length === 0) return undefined;
  const antes: Record<string, unknown> = {
    cuentaId: base.cuentaId,
    fecha: base.fecha,
    total: base.total,
    comercio: vacioANulo(base.comercio),
    nota: vacioANulo(base.nota),
    lineas: base.lineas.map((l) => ({ monto: l.monto, destino: destinoDe(l) })),
    ...visto,
  };
  return {
    transaccionId,
    ...cambios,
    esperado: Object.fromEntries(claves.map((k) => [k, antes[k]])),
  };
}

/** Los valores actuales de un `conflicto_desactualizado` (`datos`, en centavos) con la forma de `esperado`. */
export function vistoDeConflicto(
  datos: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const texto = (v: unknown): unknown =>
    typeof v === 'number' ? centavosATextoDecimal(v as Centavos) : v;
  return Object.fromEntries(
    Object.entries(datos).map(([k, v]) => [
      k,
      k === 'lineas'
        ? (v as readonly { monto: number; destino?: unknown }[]).map((l) => ({
            ...l,
            monto: texto(l.monto),
          }))
        : texto(v),
    ]),
  );
}
