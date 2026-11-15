// OP-31b Cobrar varios (04 §3.5 [CH-291]): un cobro OP-31 por línea en un solo `escribir()`. Huella (4.6.1): el primer cobro
// (fecha, cuenta y una línea marcada); los demás llevan ids derivados (BE-31). La salida sale del mismo `repartoDeCobro`.
import type { Hechos, Rechazo } from '@finn/dominio';
import { repartoDeCobro, type ParteDeCobro } from '@finn/dominio/selectores';
import { op31b, type EntradaOp31b, type SalidaOp31b } from '../../contratos/eventos.ts';
import type { DefinicionOperacion, Veredicto } from '../marco.ts';

type Resuelto = { readonly entrada: EntradaOp31b; readonly reparto: ParteDeCobro[] | Rechazo };

function huella(h: Hechos, e: EntradaOp31b): Veredicto<SalidaOp31b> {
  const t = h.transacciones.find((x) => x.id === e.id);
  if (t === undefined) return { tipo: 'aplicar' };
  const cuenta = h.efectos.find((f) => f.transaccionId === e.id)?.cuentaId;
  const linea = t.lineaCobradaId;
  return t.tipo === 'cobro' &&
    t.fecha === e.fecha &&
    cuenta === e.cuentaId &&
    linea !== null &&
    e.lineaIds.includes(linea)
    ? { tipo: 'ya_aplicada', salida: { id: e.id, cobros: [] } }
    : { tipo: 'conflicto_id' };
}

export const OP31B: DefinicionOperacion<EntradaOp31b, Resuelto, SalidaOp31b> = {
  id: 'OP-31b',
  contrato: op31b,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (_tx, e, h) => huella(h, e),
  resolver: (_tx, e, h) => Promise.resolve({ entrada: e, reparto: repartoDeCobro(h, e) }),
  comando: ({ entrada: e }, instante, ids) => ({ ...e, operacion: 'OP-31b', instante, ids }),
  // Solo se llama tras el éxito de `aplicar`, que repartió igual: aquí nunca llega un rechazo.
  salida: (_r, { entrada: e, reparto: r }) => ({ id: e.id, cobros: Array.isArray(r) ? r : [] }),
};
