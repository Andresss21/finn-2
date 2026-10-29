// OP-24 Pagar cuota de préstamo o abonar a capital (01 §5.4, 04 §3.4; P3, H6, supuesto 16): origen
// −total (efectivo, o tarjeta por C-1 y CB-07); en el préstamo −capital, con interés y seguro como
// costo en una cuota; una línea a la categoría por el total. El desglose lo propone el modelo del
// préstamo (Anexo A, `desglosePropuesto`) y la entrada trae el que confirmó o corrigió el usuario.
import { capitalPendiente } from '../calculo/saldos';
import type * as H from '../hechos';
import { bancoAgricola, condicionesAgricola } from '../prestamos/agricola';
import type { DesgloseCuota, EstadoCuota, PagoPrestamo } from '../prestamos/contrato';
import { amortizacionDe, pagosDe } from '../selectores/detalle-cuenta';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { alta, categoriaNormal, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

/** El desglose del modelo y la cuota emparejada, con la forma del contexto `cuota_prestamo` (04 §6.14.4, §4.3 [CH-36]). */
export interface PropuestaCuota {
  readonly desglosePropuesto: DesgloseCuota & {
    readonly total: Centavos;
    readonly numeroCuota: number;
  };
  readonly cuotaEmparejada: {
    readonly numero: number;
    readonly fecha: FechaLocal;
    readonly estado: EstadoCuota;
  };
}

/** El pago que se propone: después de los registrados del mismo día (`emparejar` ordena por fecha e id; `~` > hex). */
const PROPUESTO = '~propuesto' as H.Uuid;

/**
 * Desglose propuesto para un pago en `fecha` (Anexo A.2 puntos 7 y 8): la cuota de `numeroCuota`, si se indicó, o la
 * no pagada a ±10 días o menos de `fecha`, la más cercana (`bancoAgricola.emparejar`), con su desglose sobre el capital
 * pendiente registrado. `null` si el préstamo no tiene modelo o ninguna cuota empareja.
 */
export function desglosePropuesto(
  antes: H.Instantanea,
  prestamoId: H.Uuid,
  fecha: FechaLocal,
  numeroCuota?: number,
): PropuestaCuota | null {
  const { hechos: h } = antes;
  const p = h.prestamos.find((x) => x.cuentaId === prestamoId);
  const apertura = h.cuentas.find((k) => k.id === prestamoId)?.fechaApertura;
  const c = p === undefined || apertura === undefined ? null : condicionesAgricola(p, apertura);
  if (p === undefined || c === null) return null;
  const cero = Centavos.cero;
  const pago: PagoPrestamo = {
    id: PROPUESTO,
    tipo: 'cuota',
    fecha,
    capital: cero,
    interes: cero,
    seguro: cero,
    numeroCuota: numeroCuota ?? null,
  };
  const pagos = [...pagosDe(antes, prestamoId), pago];
  const n = bancoAgricola.emparejar(c, pagos).find((e) => e.pagoId === PROPUESTO)?.numero;
  const q = n == null ? undefined : amortizacionDe(antes, p)?.find((x) => x.numero === n);
  if (q === undefined) return null;
  const d = bancoAgricola.desglosePropuesto(c, q.numero, capitalPendiente(h, prestamoId));
  const total = Centavos.sumar(Centavos.sumar(d.capital, d.interes), d.seguro);
  return {
    desglosePropuesto: { ...d, total, numeroCuota: q.numero },
    cuotaEmparejada: { numero: q.numero, fecha: q.fecha, estado: q.estado },
  };
}

export function op24(antes: H.Instantanea, x: H.ComandoOp24): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const { capital, interes, seguro, total } = x;
  const abono = x.modalidad === 'abono';
  if ([capital, interes, seguro].some((v) => v < 0) || (abono && interes + seguro !== 0))
    throw new TypeError(`OP-24: desglose inválido ${capital}/${interes}/${seguro}`);
  const o = cuentaDe(h, x.origenId, 'efectivo', 'tarjeta');
  if (esRechazo(o)) return o;
  const p = cuentaDe(h, x.prestamoId, 'prestamo');
  if (esRechazo(p)) return p;
  const c = categoriaNormal(h, x.categoriaId);
  if (esRechazo(c)) return c;
  const suma = Centavos.sumar(Centavos.sumar(capital, interes), seguro);
  if (suma !== total) return { codigo: 'desglose_no_cuadra', datos: { suma, total } };
  const pendiente = capitalPendiente(h, p.id);
  if (capital > pendiente)
    return { codigo: 'capital_mayor_que_pendiente', datos: { capital, pendiente } };
  const costo = abono ? {} : { interes, seguro };
  const partes = [
    { cuentaId: o.id, monto: Centavos.negar(total) },
    { cuentaId: p.id, monto: Centavos.negar(capital), ...costo },
  ];
  const linea = { monto: total, categoriaId: c.id, deudorId: null };
  return { cambios: alta(x, abono ? 'abono_capital' : 'cuota_prestamo', partes, [linea]) };
}
