// OP-34 Eliminar evento (04 §3.5): eliminación (4.6.3). Un cobro o una devolución se elimina como OP-29 (`resolver`
// carga los movimientos [H] de su transacción); una condonación, su fila. Sin la fila pero con registro en
// `eliminaciones` (30 días), `ya_aplicada`; si no, `no_encontrado`. Un id de otro tipo es una entrada imposible.
import { fueEliminada, leerMovimientosDeTransaccion } from '@finn/db';
import type { Movimiento } from '@finn/dominio';
import { op34, type EntradaOp34 } from '../../contratos/eventos.ts';
import { ErrorValidacion, type DefinicionOperacion } from '../marco.ts';

type Resuelto = { readonly entrada: EntradaOp34; readonly movimientos: readonly Movimiento[] };

export const OP34: DefinicionOperacion<EntradaOp34, Resuelto, Record<string, never>> = {
  id: 'OP-34',
  contrato: op34,
  idempotencia: 'eliminacion',
  async comprobarIdempotencia(tx, e, h) {
    const esCondonacion = e.tipo === 'condonacion';
    const id = esCondonacion ? e.condonacionId : e.transaccionId;
    const existe = esCondonacion
      ? h.condonaciones.some((x) => x.id === id)
      : h.transacciones.some((x) => x.id === id);
    if (existe) return { tipo: 'aplicar' };
    return (await fueEliminada(tx, esCondonacion ? 'condonaciones' : 'transacciones', id))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  async resolver(tx, e, h) {
    if (e.tipo === 'condonacion') return { entrada: e, movimientos: [] };
    const t = h.transacciones.find((x) => x.id === e.transaccionId);
    if (t !== undefined && t.tipo !== e.tipo)
      throw new ErrorValidacion(
        'transaccionId',
        e.tipo === 'cobro'
          ? 'Ese movimiento no es un cobro.'
          : 'Ese movimiento no es una devolución.',
      );
    return { entrada: e, movimientos: await leerMovimientosDeTransaccion(tx, e.transaccionId) };
  },
  comando: ({ entrada, movimientos }, instante, ids) => ({
    operacion: 'OP-34',
    instante,
    ids,
    movimientos,
    ...(entrada.tipo === 'condonacion'
      ? { tipo: 'condonacion' as const, condonacionId: entrada.condonacionId }
      : { tipo: entrada.tipo, transaccionId: entrada.transaccionId }),
  }),
  salida: () => ({}),
};
