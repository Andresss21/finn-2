// OP-23 Pagar tarjeta (01 §5.4, 04 §3.4; P8, I3, H5): efectivo −P, tarjeta +P y una línea a pago(t)
// por P. AV-10 antes de confirmar si P supera máx(0, Disp(pago(t))) en el período de la fecha; un
// pago sin deuda se permite y deja saldo a favor (CB-01); en un período cerrado, AV-01 (CB-26).
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { pagoDe } from './op-01';
import { alta, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op23(antes: H.Instantanea, x: H.ComandoOp23): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const o = cuentaDe(h, x.origenId, 'efectivo');
  if (esRechazo(o)) return o;
  const t = cuentaDe(h, x.tarjetaId, 'tarjeta');
  if (esRechazo(t)) return t;
  const pago = pagoDe(h, t.id);
  if (pago === undefined) throw new RangeError(`tarjeta ${t.id} sin categoría de pago (inv. 22)`);
  const partes = [
    { cuentaId: o.id, monto: Centavos.negar(x.total) },
    { cuentaId: t.id, monto: x.total },
  ];
  const linea = { monto: x.total, categoriaId: pago.id, deudorId: null };
  const cambios = alta(x, 'pago_tarjeta', partes, [linea]);
  // Una fecha sin período (antes de todos) no tiene celda: la rechaza `aplicar` (inv. 12).
  const delPeriodo = antes.presupuesto.celdas.find(
    (y) => y.categoriaId === pago.id && y.periodo.inicio <= x.fecha && x.fecha <= y.periodo.fin,
  );
  const reservado = Centavos.max(Centavos.cero, delPeriodo?.disponible ?? Centavos.cero);
  if (x.total <= reservado) return { cambios };
  const datos = { tarjetaId: t.id, exceso: Centavos.restar(x.total, reservado) };
  const av10 = { codigo: 'AV-10', momento: 'antes', requiereConfirmacion: true, datos } as const;
  return { cambios, avisos: [av10] };
}
