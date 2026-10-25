// Deuda sin respaldo, "te falta reservar" y reserva excedente (01 §4.8; O2, PS, Q4, F4; inv. 2 y 3).
// Todo sale de deuda(t) (§4.3) y de la celda de pago(t) en el período activo de `presupuesto`
// (§4.6): nunca se guarda. Las asignaciones a pago(t) en períodos futuros no entran en R⁺(t),
// porque solo se lee Disp(pago(t), A).
import type { Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Presupuesto } from './disponible';
import { deuda, type HechosDeSaldo } from './saldos';
import { pagoExcedente } from './sobregiros';

export interface EstadoDeTarjeta {
  readonly tarjetaId: Uuid;
  /** deuda(t) = máx(0, −saldo(t)). */
  readonly deuda: Centavos;
  /** Disp(pago(t), A): puede ser negativo (pago excedente). */
  readonly disponibleDePago: Centavos;
  /** R⁺(t) = máx(0, Disp(pago(t), A)). */
  readonly reservado: Centavos;
  /** S(t) = máx(0, deuda(t) − R⁺(t)): el número principal, "te falta reservar" (F4). */
  readonly sinRespaldo: Centavos;
  /** RE(t) = máx(0, R⁺(t) − deuda(t)); si es > 0 se muestra AV-08. */
  readonly reservaExcedente: Centavos;
  /** E(t, A): información secundaria de la presentación (F4, §4.7). */
  readonly pagoExcedente: Centavos;
}

/**
 * S(t), RE(t) y su descomposición deuda(t) = R⁺(t) + S(t) − RE(t), con S(t) = 0 o RE(t) = 0.
 * `b` debe salir de `presupuesto` con los mismos hechos (y sus pagos implícitos, §4.10).
 */
export function estadoDeTarjeta(
  h: HechosDeSaldo,
  b: Presupuesto,
  tarjetaId: Uuid,
): EstadoDeTarjeta {
  const pago = b.celdas.find(
    (x) => x.clase === 'pago' && x.tarjetaId === tarjetaId && x.periodo.inicio === b.activo.inicio,
  );
  if (pago === undefined)
    throw new RangeError(`la tarjeta ${tarjetaId} no tiene categoría de pago`);
  const d = deuda(h, tarjetaId);
  const reservado = Centavos.max(Centavos.cero, pago.disponible);
  return {
    tarjetaId,
    deuda: d,
    disponibleDePago: pago.disponible,
    reservado,
    sinRespaldo: Centavos.max(Centavos.cero, Centavos.restar(d, reservado)),
    reservaExcedente: Centavos.max(Centavos.cero, Centavos.restar(reservado, d)),
    pagoExcedente: pagoExcedente(pago),
  };
}

/** "Te falta reservar" (PS, O2): es S(t). */
export const teFaltaReservar = (x: EstadoDeTarjeta): Centavos => x.sinRespaldo;
