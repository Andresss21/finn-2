// Posible duplicado (01 §4.17, P16, supuesto 9; OP-35 paso 8): una transacción o un movimiento no
// descartado con la misma cuenta, el mismo monto, |Δ fecha| ≤ 1 día y texto distinto. Las dos
// clases cuentan (CB-17). Un movimiento aprobado cuenta por su transacción, no dos veces. Si hay
// varias: la fecha más cercana, después la transacción antes que el movimiento, después el id.
import type { Hechos, MovimientoConTexto, Uuid } from '../hechos';
import { FechaLocal } from '../valores/fecha-local';
import type { Comparable } from './emparejamiento';

export type Duplicado =
  | { readonly transaccionId: Uuid; readonly movimientoId?: never }
  | { readonly movimientoId: Uuid; readonly transaccionId?: never };

const FUERA = new Set(['descartado', 'autodescartado', 'aprobado']);

export function duplicado(
  h: Pick<Hechos, 'transacciones' | 'efectos'>,
  movimientos: readonly MovimientoConTexto[],
  sms: Comparable & { readonly texto: string },
): Duplicado | undefined {
  const textoDe = new Map(movimientos.map((m) => [m.transaccionId, m.texto]));
  const cerca = (fecha: FechaLocal) => Math.abs(FechaLocal.diasEntre(fecha, sms.fecha));
  const fechaDe = new Map(h.transacciones.map((t) => [t.id, t.fecha]));
  const txs = h.efectos
    .filter((e) => e.cuentaId === sms.cuentaId && Math.abs(e.monto) === sms.monto)
    .flatMap((e) => {
      const fecha = fechaDe.get(e.transaccionId);
      const texto = textoDe.get(e.transaccionId);
      return fecha === undefined || cerca(fecha) > 1 || texto === sms.texto
        ? []
        : [{ dias: cerca(fecha), clase: 0, id: e.transaccionId }];
    });
  const movs = movimientos
    .filter((m) => !FUERA.has(m.estado) && m.cuentaId === sms.cuentaId && m.monto === sms.monto)
    .flatMap((m) =>
      m.fecha === null || cerca(m.fecha) > 1 || m.texto === sms.texto
        ? []
        : [{ dias: cerca(m.fecha), clase: 1, id: m.id }],
    );
  const [elegido] = [...txs, ...movs].sort(
    (a, b) => a.dias - b.dias || a.clase - b.clase || (a.id < b.id ? -1 : 1),
  );
  if (elegido === undefined) return undefined;
  return elegido.clase === 0 ? { transaccionId: elegido.id } : { movimientoId: elegido.id };
}
