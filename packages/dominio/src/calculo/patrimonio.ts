// Patrimonio neto y datos informativos de tarjeta (01 §4.14; P9, P8, supuesto 19). Todo es
// derivado e informativo: ningún número de esta pieza cambia el presupuesto.
import type { Hechos, Tarjeta, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { porCobrarAbierto, type PorCobrar } from './por-cobrar';
import { capitalPendiente, deuda, type HechosDeSaldo, saldo, saldoAFavor, saldoAl } from './saldos';

export interface PatrimonioNeto {
  readonly efectivo: Centavos;
  readonly saldosAFavor: Centavos;
  readonly inversiones: Centavos;
  readonly porCobrar: Centavos;
  readonly deudasDeTarjeta: Centavos;
  readonly prestamos: Centavos;
  readonly total: Centavos;
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/**
 * Σ saldos de efectivo + Σ saldos a favor + Σ valor de inversiones + Σ por cobrar abiertos
 * − Σ deudas de tarjeta − Σ capital pendiente de préstamos [P9], con `cobros` de los mismos hechos.
 */
export function patrimonioNeto(
  h: HechosDeSaldo & Pick<Hechos, 'cuentas'>,
  cobros: readonly PorCobrar[],
): PatrimonioNeto {
  const de = (tipo: string, valor: (h: HechosDeSaldo, id: Uuid) => Centavos) =>
    suma(h.cuentas.filter((k) => k.tipo === tipo).map((k) => valor(h, k.id)));
  const x = {
    efectivo: de('efectivo', saldo),
    saldosAFavor: de('tarjeta', saldoAFavor),
    inversiones: de('inversion', saldo),
    porCobrar: porCobrarAbierto(cobros),
    deudasDeTarjeta: de('tarjeta', deuda),
    prestamos: de('prestamo', capitalPendiente),
  };
  const activos = suma([x.efectivo, x.saldosAFavor, x.inversiones, x.porCobrar]);
  return { ...x, total: Centavos.restar(activos, Centavos.sumar(x.deudasDeTarjeta, x.prestamos)) };
}

/** Fecha de corte en el mes de `mes`: fecha(m, mín(día de corte, días de m)) [supuesto 19]. */
export const fechaDeCorte = (diaCorte: number, mes: FechaLocal): FechaLocal =>
  FechaLocal.inicioDeMes(mes, diaCorte);

/** c₀: la última fecha de corte estrictamente anterior a `f`. */
export function ultimoCorteAntesDe(diaCorte: number, f: FechaLocal): FechaLocal {
  const este = fechaDeCorte(diaCorte, f);
  return este < f ? este : fechaDeCorte(diaCorte, FechaLocal.sumarMeses(este, -1));
}

/** Ciclo de facturación que contiene `f`: del día siguiente a un corte hasta el corte siguiente. */
export function cicloDeFacturacion(
  diaCorte: number,
  f: FechaLocal,
): { readonly desde: FechaLocal; readonly hasta: FechaLocal } {
  const este = fechaDeCorte(diaCorte, f);
  const hasta = este >= f ? este : fechaDeCorte(diaCorte, FechaLocal.sumarMeses(este, 1));
  return { desde: FechaLocal.sumarDias(ultimoCorteAntesDe(diaCorte, f), 1), hasta };
}

export interface DesgloseDePago {
  readonly corte: FechaLocal;
  /** máx(0, −saldo(t, c₀)). */
  readonly deudaAnterior: Centavos;
  /** Σ efectos negativos en t con fecha en (c₀, f], como monto ≥ 0. */
  readonly cargosDelCiclo: Centavos;
  /** Σ efectos positivos en t con fecha en (c₀, f]. */
  readonly yaPagado: Centavos;
  /** Monto para no generar intereses = máx(0, deuda anterior − ya pagado). */
  readonly paraNoGenerarIntereses: Centavos;
}

/** Desglose al pagar en la fecha `f`, con c₀ = `corte` [P8]. Es informativo: no cambia nada. */
export function desgloseAlPagar(
  h: HechosDeSaldo,
  t: Pick<Tarjeta, 'cuentaId' | 'diaCorte'>,
  f: FechaLocal,
): DesgloseDePago {
  const corte = ultimoCorteAntesDe(t.diaCorte, f);
  const fechas = new Map(h.transacciones.map((x) => [x.id, x.fecha]));
  let cargosDelCiclo = Centavos.cero;
  let yaPagado = Centavos.cero;
  for (const e of h.efectos) {
    const fecha = fechas.get(e.transaccionId);
    if (e.cuentaId !== t.cuentaId || fecha === undefined || fecha <= corte || fecha > f) continue;
    if (e.monto < 0) cargosDelCiclo = Centavos.restar(cargosDelCiclo, e.monto);
    else yaPagado = Centavos.sumar(yaPagado, e.monto);
  }
  const deudaAnterior = Centavos.max(Centavos.cero, Centavos.negar(saldoAl(h, t.cuentaId, corte)));
  const paraNoGenerarIntereses = Centavos.max(
    Centavos.cero,
    Centavos.restar(deudaAnterior, yaPagado),
  );
  return { corte, deudaAnterior, cargosDelCiclo, yaPagado, paraNoGenerarIntereses };
}

/** Un pago de `monto` presentado aplicado primero a lo que queda de la deuda anterior. */
export function aplicarPago(
  d: DesgloseDePago,
  monto: Centavos,
): { readonly aDeudaAnterior: Centavos; readonly resto: Centavos } {
  const aDeudaAnterior = Centavos.min(monto, d.paraNoGenerarIntereses);
  return { aDeudaAnterior, resto: Centavos.restar(monto, aDeudaAnterior) };
}
