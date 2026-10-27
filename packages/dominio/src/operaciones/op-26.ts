// OP-26 Registrar desembolso de préstamo (01 §5.4, 04 §3.4; H13): préstamo +X en capital y
// efectivo +X; entra a LPA como otras entradas (§4.13).
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { alta, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op26(antes: H.Instantanea, x: H.ComandoOp26): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const p = cuentaDe(h, x.prestamoId, 'prestamo');
  if (esRechazo(p)) return p;
  const k = cuentaDe(h, x.cuentaId, 'efectivo');
  if (esRechazo(k)) return k;
  const partes = [
    { cuentaId: p.id, monto: x.total },
    { cuentaId: k.id, monto: x.total },
  ];
  return { cambios: alta(x, 'desembolso_prestamo', partes) };
}
