// OP-24 Pagar cuota de préstamo o abonar a capital (01 §5.4, 04 §3.4; P3, H6, supuesto 16): origen
// −total (efectivo, o tarjeta por C-1 y CB-07); en el préstamo −capital, con interés y seguro como
// costo en una cuota; una línea a la categoría por el total. El desglose lo propone el modelo del
// préstamo (Anexo A, `desglosePropuesto`) y la entrada trae el que confirmó o corrigió el usuario.
import { capitalPendiente } from '../calculo/saldos';
import type * as H from '../hechos';
import { bancoAgricola, condicionesAgricola } from '../prestamos/agricola';
import type { DesgloseCuota } from '../prestamos/contrato';
import { amortizacionDe } from '../selectores/detalle-cuenta';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { alta, categoriaNormal, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

/**
 * Desglose propuesto de la cuota `numero` (por defecto, la primera que no está pagada) con el
 * capital pendiente registrado, o `null` si el préstamo no tiene modelo (04 §3.4, previsualización).
 */
export function desglosePropuesto(
  antes: H.Instantanea,
  prestamoId: H.Uuid,
  numero?: number,
): (DesgloseCuota & { readonly numero: number }) | null {
  const { hechos: h } = antes;
  const p = h.prestamos.find((x) => x.cuentaId === prestamoId);
  const apertura = h.cuentas.find((k) => k.id === prestamoId)?.fechaApertura;
  const c = p === undefined || apertura === undefined ? null : condicionesAgricola(p, apertura);
  if (p === undefined || c === null) return null;
  const n = numero ?? amortizacionDe(antes, p)?.find((q) => q.estado !== 'pagada')?.numero;
  if (n === undefined) return null;
  return { numero: n, ...bancoAgricola.desglosePropuesto(c, n, capitalPendiente(h, prestamoId)) };
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
