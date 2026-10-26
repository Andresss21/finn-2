// OP-22 Transferencia neutral (01 §5.4, 04 §3.4; P15): −total en el origen y +total en el destino,
// dos cuentas de efectivo distintas (CB-29). Solo cambian los saldos.
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { alta, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op22(antes: H.Instantanea, x: H.ComandoOp22): Efecto | H.Rechazo {
  const o = cuentaDe(antes.hechos, x.origenId, 'efectivo');
  if (esRechazo(o)) return o;
  const d = cuentaDe(antes.hechos, x.destinoId, 'efectivo');
  if (esRechazo(d)) return d;
  if (o.id === d.id) return { codigo: 'cuentas_iguales', datos: { cuentaId: o.id } };
  const partes = [
    { cuentaId: o.id, monto: Centavos.negar(x.total) },
    { cuentaId: d.id, monto: x.total },
  ];
  return { cambios: alta(x, 'transferencia', partes) };
}
