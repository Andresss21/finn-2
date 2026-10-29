// Saldos de cuenta (01 §4.3, inv. 4). Son derivados: nunca se guardan. `efectos.monto` ya es el
// efecto que cambia el saldo (2.2.10): en un préstamo es el capital (−capital en una cuota, 03 §4.5.1);
// interés y seguro quedan como costo y no suman. El uso del límite es una proyección (04 §6:
// `usoLimite` en puntos básicos con redondeo), no un saldo: no va aquí.
import type { Hechos, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { porId } from './devoluciones';
import type { FechaLocal } from '../valores/fecha-local';

/** Lo que leen los saldos: las transacciones (fecha y estado bancario) y sus efectos. */
export type HechosDeSaldo = Pick<Hechos, 'transacciones' | 'efectos'>;

/** `hasta`: solo transacciones con fecha ≤ hasta; `confirmado`: solo confirmadas o conciliadas (P11). */
export interface FiltroDeSaldo {
  readonly hasta?: FechaLocal;
  readonly confirmado?: boolean;
}

/** saldo(k): Σ de los efectos de la cuenta k que pasan el filtro. `transacciones`: por id. */
export function saldo(
  h: HechosDeSaldo,
  cuentaId: Uuid,
  filtro: FiltroDeSaldo = {},
  transacciones: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
): Centavos {
  let total = Centavos.cero;
  for (const e of h.efectos) {
    if (e.cuentaId !== cuentaId) continue;
    const t = transacciones.get(e.transaccionId);
    if (t === undefined) throw new RangeError(`efecto ${e.id} sin su transacción`);
    if (filtro.hasta !== undefined && t.fecha > filtro.hasta) continue;
    if (filtro.confirmado === true && t.estadoBancario === 'pendiente') continue;
    total = Centavos.sumar(total, e.monto);
  }
  return total;
}

/** saldo(k) y saldo(k, { confirmado: true }) en una sola pasada por los efectos [BE-23]. */
export function saldoYConfirmado(
  h: HechosDeSaldo,
  cuentaId: Uuid,
  transacciones: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
): { readonly saldo: Centavos; readonly confirmado: Centavos } {
  let total = Centavos.cero;
  let confirmado = Centavos.cero;
  for (const e of h.efectos) {
    if (e.cuentaId !== cuentaId) continue;
    const t = transacciones.get(e.transaccionId);
    if (t === undefined) throw new RangeError(`efecto ${e.id} sin su transacción`);
    total = Centavos.sumar(total, e.monto);
    if (t.estadoBancario !== 'pendiente') confirmado = Centavos.sumar(confirmado, e.monto);
  }
  return { saldo: total, confirmado };
}

/** saldo(k, f): solo los efectos de transacciones con fecha ≤ f. */
export const saldoAl = (h: HechosDeSaldo, cuentaId: Uuid, f: FechaLocal): Centavos =>
  saldo(h, cuentaId, { hasta: f });

/** Saldo confirmado: solo transacciones confirmadas o conciliadas. */
export const saldoConfirmado = (h: HechosDeSaldo, cuentaId: Uuid): Centavos =>
  saldo(h, cuentaId, { confirmado: true });

/** deuda(t) = máx(0, −saldo(t)), desde saldo(t). */
export const deudaDe = (s: Centavos): Centavos => Centavos.max(Centavos.cero, Centavos.negar(s));

/** deuda(t) = máx(0, −saldo(t)). */
export const deuda = (h: HechosDeSaldo, tarjetaId: Uuid): Centavos => deudaDe(saldo(h, tarjetaId));

/** saldo a favor(t) = máx(0, saldo(t)), desde saldo(t). */
export const aFavorDe = (s: Centavos): Centavos => Centavos.max(Centavos.cero, s);

/** saldo a favor(t) = máx(0, saldo(t)). */
export const saldoAFavor = (h: HechosDeSaldo, tarjetaId: Uuid): Centavos =>
  aFavorDe(saldo(h, tarjetaId));

/** Capital pendiente de un préstamo: su saldo, que solo suma capital. */
export const capitalPendiente = (h: HechosDeSaldo, prestamoId: Uuid): Centavos =>
  saldo(h, prestamoId);

/** Valor de una inversión: su saldo. */
export const valorDeInversion = (h: HechosDeSaldo, inversionId: Uuid): Centavos =>
  saldo(h, inversionId);
