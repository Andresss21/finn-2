// OP-29 Eliminar transacción (04 §3.4): eliminación (4.6.3). Si la transacción ya no existe pero `eliminaciones` la
// registra (30 días, 03 §5.3), `ya_aplicada`; si no, `no_encontrado`. `resolver` carga los movimientos [H] que la
// tienen como `transaccion_id`: el dominio los pasa a descartado antes de borrarla (F1, 03 §4.6.1).
import { fueEliminada, leerMovimientosDeTransaccion } from '@finn/db';
import type { Movimiento } from '@finn/dominio';
import { op29, type EntradaOp29 } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';

type Resuelto = { readonly entrada: EntradaOp29; readonly movimientos: readonly Movimiento[] };

export const OP29: DefinicionOperacion<EntradaOp29, Resuelto, Record<string, never>> = {
  id: 'OP-29',
  contrato: op29,
  idempotencia: 'eliminacion',
  async comprobarIdempotencia(tx, e, h) {
    if (h.transacciones.some((t) => t.id === e.transaccionId)) return { tipo: 'aplicar' };
    return (await fueEliminada(tx, 'transacciones', e.transaccionId))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  async resolver(tx, e) {
    return { entrada: e, movimientos: await leerMovimientosDeTransaccion(tx, e.transaccionId) };
  },
  comando: ({ entrada, movimientos }, instante, ids) => ({
    operacion: 'OP-29',
    transaccionId: entrada.transaccionId,
    instante,
    ids,
    movimientos,
  }),
  salida: () => ({}),
};
