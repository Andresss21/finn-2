// OP-21 Registrar ingreso (01 §5.4, 04 §3.4; H2): +total en una cuenta de efectivo, que entra a LPA.
// Dinero que llega a una tarjeta sin ser un cobro es OP-27b.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { alta, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op21(antes: H.Instantanea, x: H.ComandoOp21): Efecto | H.Rechazo {
  const k = cuentaDe(antes.hechos, x.cuentaId, 'efectivo');
  if (esRechazo(k)) return k;
  return { cambios: alta(x, 'ingreso', [{ cuentaId: k.id, monto: x.total }]) };
}
