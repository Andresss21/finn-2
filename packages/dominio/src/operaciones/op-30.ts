// OP-30 Cambiar estado bancario (01 §5.4, §7.2; 04 §3.4; P11, A-3): a mano solo pendiente ↔
// confirmada; `conciliada` la fija y la quita la conciliación (OP-47) o un cambio posterior (OP-28).
// Sin efectos de cálculo, salvo en el saldo confirmado.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

const ESTADOS = new Set<string>(['pendiente', 'confirmada', 'conciliada']);

export function op30(antes: H.Instantanea, x: H.ComandoOp30): Efecto | H.Rechazo {
  const t = buscar(antes.hechos.transacciones, x.transaccionId, 'transacciones');
  if (esRechazo(t)) return t;
  const [desde, hacia] = [t.estadoBancario, x.estadoNuevo as H.EstadoBancario];
  if (!ESTADOS.has(hacia)) throw new TypeError(`OP-30: estado ${hacia}`);
  if (desde === 'conciliada' || hacia === 'conciliada')
    return { codigo: 'transicion_estado_bancario_invalida', datos: { desde, hacia } };
  if (desde === hacia) return { cambios: [] };
  const campos = { estadoBancario: hacia };
  return { cambios: [{ tipo: 'actualizar', tabla: 'transacciones', id: t.id, campos }] };
}
