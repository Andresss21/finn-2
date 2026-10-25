// Sobregiros y pago excedente (01 §4.7; O2, Q7). Todo sale de las celdas de `presupuesto` (§4.6):
// aquí no se recalcula ningún Disponible.
import type { Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { type Celda, type Presupuesto, reduccionDe } from './disponible';

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const delActivo = (b: Presupuesto) => b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);
const en = (b: Presupuesto, fecha: string) => b.activo.inicio <= fecha && fecha <= b.activo.fin;

/** Sobregiro total máx(0, −Disp(c, p)) = SobT(c, p) + SobD(c, p). */
export const sobregiro = (x: Celda): Centavos => x.reinicio;

/** E(t, p) = máx(0, −Disp(pago(t), p)); 0 en una categoría normal. */
export const pagoExcedente = (x: Celda): Centavos =>
  x.clase === 'pago' ? x.reinicio : Centavos.cero;

/** SobTA = Σ_c SobT(c, A). */
export const sobregiroConTarjetaDelActivo = (b: Presupuesto): Centavos =>
  suma(delActivo(b).map((x) => x.sobT));

/** Reducción de LPA proyectada al cierre del activo: Σ_c SobD(c, A) + Σ_t E(t, A). */
export const reduccionProyectada = (b: Presupuesto): Centavos =>
  suma(delActivo(b).map(reduccionDe));

/** E(t, A) repartido por causa, para los avisos AV-05, AV-06 y AV-04 (§5.0.7). */
export interface Atribucion {
  readonly cobros: Centavos;
  readonly devoluciones: Centavos;
  readonly pagos: Centavos;
}

/**
 * Reparte E(t, A) en este orden, cada causa hasta su suma en el activo [Propio; solo presentación]:
 * 1) cobros: los pagos implícitos de t; 2) devoluciones: r de las D-3 y X de las D-4 en t;
 * 3) pagos: el resto.
 */
export function atribucionDelExcedente(b: Presupuesto, tarjetaId: Uuid): Atribucion {
  const pago = delActivo(b).find((x) => x.clase === 'pago' && x.tarjetaId === tarjetaId);
  const e = pago === undefined ? Centavos.cero : pagoExcedente(pago);
  const deCobros = suma(
    b.pagosImplicitos
      .filter((i) => i.tarjetaId === tarjetaId && en(b, i.fecha))
      .map((i) => i.monto),
  );
  const deDevoluciones = Centavos.negar(
    suma(b.aportes.filter((d) => d.tarjetaId === tarjetaId && en(b, d.fecha)).map((d) => d.aPago)),
  );
  const cobros = Centavos.min(e, deCobros);
  const devoluciones = Centavos.min(Centavos.restar(e, cobros), deDevoluciones);
  return { cobros, devoluciones, pagos: Centavos.restar(Centavos.restar(e, cobros), devoluciones) };
}
