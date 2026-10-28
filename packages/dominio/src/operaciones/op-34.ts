// OP-34 Eliminar evento (01 §5.5, §7.4; 04 §3.5; supuesto 12): en un cobro o una devolución, los
// hechos de OP-29 sobre su transacción (movimiento, ocurrencia y cambio posterior con AV-16 si
// estaba conciliada); en una condonación, la fila. El por cobrar vuelve a abrirse. Quitar un evento
// solo sube el saldo abierto de los posteriores (§4.10), así que inv. 9 a 11 siguen valiendo; igual
// las verifica `aplicar`, junto con AV-01.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { op29 } from './op-29';
import { esRechazo } from './rechazos';

export function op34(antes: H.Instantanea, x: H.ComandoOp34): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  if (x.tipo === 'condonacion') {
    const k = buscar(h.condonaciones, x.condonacionId, 'condonaciones');
    if (esRechazo(k)) return k;
    return { cambios: [{ tipo: 'eliminar', tabla: 'condonaciones', id: k.id }] };
  }
  const t = buscar(h.transacciones, x.transaccionId, 'transacciones');
  if (esRechazo(t)) return t;
  if (t.tipo !== x.tipo) throw new TypeError(`OP-34 ${t.id}: es un ${t.tipo}, no un ${x.tipo}`);
  const { instante, ids, movimientos } = x;
  return op29(antes, { operacion: 'OP-29', transaccionId: t.id, instante, ids, movimientos });
}
