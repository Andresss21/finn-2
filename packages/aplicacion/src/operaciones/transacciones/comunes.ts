// Piezas que comparten OP-20 a OP-24 y OP-27 (04 §3.4, §4.6.1): el alta común (PT) y la huella de creación contra la
// transacción que ya exista con el mismo id. Los hechos los entrega el marco (una sola carga por transacción).
import type { AltaTransaccion, GeneradorIds, Hechos, Instante, Uuid } from '@finn/dominio';
import { montoOriginalDe, type LectorTx } from '@finn/db';
import type { Centavos } from '@finn/dominio/valores';
import type { SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { Veredicto } from '../marco.ts';

/** Lo que comparten las entradas de todas las altas. */
interface EntradaAlta {
  readonly id: Uuid;
  readonly fecha: AltaTransaccion['fecha'];
  readonly total: Centavos;
  readonly comercio?: string | undefined;
  readonly nota?: string | undefined;
  readonly monedaOriginal?: string | undefined;
  readonly montoOriginal?: AltaTransaccion['montoOriginal'] | undefined;
}

/** PT (04 §3.0.4): los campos comunes del comando; lo opcional sin valor se omite. */
export function altaDe(e: EntradaAlta, instante: Instante, ids: GeneradorIds): AltaTransaccion {
  return {
    id: e.id,
    instante,
    ids,
    fecha: e.fecha,
    total: e.total,
    ...(e.comercio === undefined ? {} : { comercio: e.comercio }),
    ...(e.nota === undefined ? {} : { nota: e.nota }),
    ...(e.monedaOriginal === undefined ? {} : { monedaOriginal: e.monedaOriginal }),
    ...(e.montoOriginal === undefined ? {} : { montoOriginal: e.montoOriginal }),
  };
}

/** Un efecto esperado (03 §4.5.1); `interes` y `seguro` solo en el préstamo de una cuota. */
export interface EfectoEsperado {
  readonly cuentaId: Uuid;
  readonly monto: Centavos;
  readonly interes?: Centavos;
  readonly seguro?: Centavos;
}

/** El destino de una línea esperada; `deudorNuevo` se compara por nombre sin mayúsculas (04 §3.0.2). */
export type DestinoEsperado =
  { readonly categoriaId: Uuid } | { readonly deudorId: Uuid } | { readonly deudorNuevo: string };

/** Lo que la solicitud determina de la transacción (4.6.1); el sistema pone el resto y no se compara. */
export interface HuellaCreacion {
  readonly entrada: EntradaAlta;
  readonly tipo: string;
  readonly efectos: readonly EfectoEsperado[];
  readonly lineas?: readonly { readonly monto: Centavos; readonly destino: DestinoEsperado }[];
}

/** `"12.5000"` y `"12.5"` son el mismo decimal. */
export const decimal = (t: string | null | undefined): string | null =>
  t == null ? null : t.includes('.') ? t.replace(/0+$/, '').replace(/\.$/, '') : t;

/** Una línea ya guardada o pedida: el par `[categoriaId, deudorId]` de su destino (el deudor nuevo, por nombre). */
export function destinoIds(h: Hechos, d: DestinoEsperado): readonly [Uuid | null, Uuid | null] {
  if ('categoriaId' in d) return [d.categoriaId, null];
  if ('deudorId' in d) return [null, d.deudorId];
  const nombre = d.deudorNuevo.toLowerCase();
  return [null, h.deudores.find((x) => x.nombre.toLowerCase() === nombre)?.id ?? null];
}

/** Forma comparable: el mismo texto si y solo si los datos coinciden. */
export const forma = (v: unknown): string => JSON.stringify(v);

/**
 * 04 §4.6.1: sin transacción con ese id, se aplica; con los mismos datos, `ya_aplicada` con el id; con otros,
 * `conflicto_id`.
 */
export async function creacion(
  tx: LectorTx,
  h: Hechos,
  id: Uuid,
  esperada: HuellaCreacion,
): Promise<Veredicto<SalidaTransaccion>> {
  const t = h.transacciones.find((x) => x.id === id);
  if (t === undefined) return { tipo: 'aplicar' };
  const { entrada: e } = esperada;
  const efectos = h.efectos
    .filter((f) => f.transaccionId === id)
    .map((f) => ({ c: f.cuentaId, m: f.monto, i: f.interes, s: f.seguro }));
  const lineas = h.lineas
    .filter((l) => l.transaccionId === id)
    .sort((a, b) => a.orden - b.orden)
    .map((l) => [l.monto, l.categoriaId, l.deudorId] as const);
  const propios = {
    tipo: t.tipo,
    fecha: t.fecha,
    total: t.total,
    origen: t.origen,
    comercio: t.comercio,
    nota: t.nota,
    moneda: t.monedaOriginal,
    // `monto_original` es informativo y el motor no lo carga (03 §3.12): se lee de la fila
    original: decimal(await montoOriginalDe(tx, id)),
    efectos: efectos.sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : a.m - b.m)),
    lineas,
  };
  const pedidos = {
    tipo: esperada.tipo,
    fecha: e.fecha,
    total: e.total,
    origen: 'manual',
    comercio: e.comercio ?? null,
    nota: e.nota ?? null,
    moneda: e.monedaOriginal ?? null,
    original: decimal(e.montoOriginal),
    efectos: esperada.efectos
      .map((f) => ({ c: f.cuentaId, m: f.monto, i: f.interes ?? null, s: f.seguro ?? null }))
      .sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : a.m - b.m)),
    lineas: (esperada.lineas ?? []).map((l) => [l.monto, ...destinoIds(h, l.destino)] as const),
  };
  return forma(propios) === forma(pedidos)
    ? { tipo: 'ya_aplicada', salida: { id } }
    : { tipo: 'conflicto_id' };
}
