// OP-50 Crear la transacción a mano desde un SMS con error (02 N-02 punto 3; 04 §3.6). Es OP-37
// sobre un movimiento en `error`, después de completar sus datos con OP-36: misma entrada,
// precondiciones, hechos y avisos. La transacción queda vinculada al SMS por su movimiento.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { estadoNoValido } from './op-36';
import { op37 } from './op-37';

export function op50(antes: H.Instantanea, x: H.ComandoOp50): Efecto | H.Rechazo {
  if (x.movimiento.estado !== 'error') return estadoNoValido(x.movimiento);
  return op37(antes, x);
}
