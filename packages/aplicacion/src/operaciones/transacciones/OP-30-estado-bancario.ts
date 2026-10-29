// OP-30 Cambiar estado bancario (04 §3.4): valor absoluto (4.6.2) sobre `estado_bancario`. En el estado nuevo es
// `ya_aplicada`, en el visto se aplica y en otro es `conflicto_desactualizado` con el estado actual. Que el cambio sea
// válido (`pendiente` ↔ `confirmada`, 01 §7.2) lo decide el dominio.
import { op30, type EntradaOp30 } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP30: DefinicionOperacion<EntradaOp30, EntradaOp30, Record<string, never>> = {
  id: 'OP-30',
  contrato: op30,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    const t = h.transacciones.find((x) => x.id === e.transaccionId);
    if (t === undefined) return { tipo: 'no_encontrado' };
    if (t.estadoBancario === e.estadoNuevo) return { tipo: 'ya_aplicada', salida: {} };
    if (t.estadoBancario === e.esperado.estado) return { tipo: 'aplicar' };
    return { tipo: 'conflicto_desactualizado', actuales: { estado: t.estadoBancario } };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-30',
    transaccionId: e.transaccionId,
    estadoNuevo: e.estadoNuevo,
  }),
  salida: () => ({}),
};
