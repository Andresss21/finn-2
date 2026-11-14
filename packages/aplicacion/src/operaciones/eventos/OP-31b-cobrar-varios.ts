// OP-31b Cobrar varios (04 §3.5 [CH-291]): un pago de un deudor repartido entre sus líneas marcadas con la regla del dominio
// (`repartoDeCobro`), un cobro OP-31 por línea, en un solo `escribir()`: se guardan todos o ninguno. El primer cobro lleva el
// `id` de la entrada y los demás, ids derivados de él (BE-31). La huella de creación (4.6.1) es la de ese primer cobro: cobro,
// misma fecha y cuenta y una línea de las marcadas; si no, `conflicto_id`. La salida dice cuánto cobró de cada línea y con
// qué saldo quedó, para el resultado de la interfaz (PF-3); calculada sobre los mismos hechos que usa `aplicar`.
import { repartoDeCobro, type Hechos, type ParteDeCobro, type Rechazo } from '@finn/dominio';
import { op31b, type EntradaOp31b, type SalidaOp31b } from '../../contratos/eventos.ts';
import type { DefinicionOperacion, Veredicto } from '../marco.ts';

interface Resuelto {
  readonly entrada: EntradaOp31b;
  readonly reparto: readonly ParteDeCobro[] | Rechazo;
}

function huella(h: Hechos, e: EntradaOp31b): Veredicto<SalidaOp31b> {
  const t = h.transacciones.find((x) => x.id === e.id);
  if (t === undefined) return { tipo: 'aplicar' };
  const cuenta = h.efectos.find((f) => f.transaccionId === e.id)?.cuentaId;
  const igual =
    t.tipo === 'cobro' &&
    t.fecha === e.fecha &&
    cuenta === e.cuentaId &&
    t.lineaCobradaId !== null &&
    e.lineaIds.includes(t.lineaCobradaId);
  return igual
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
  comando: ({ entrada: e }, instante, ids) => ({
    operacion: 'OP-31b',
    id: e.id,
    instante,
    ids,
    deudorId: e.deudorId,
    lineaIds: e.lineaIds,
    cuentaId: e.cuentaId,
    fecha: e.fecha,
    total: e.total,
  }),
  // Solo se llama con el éxito de `aplicar`, que repartió igual: un rechazo nunca llega aquí.
  salida: (_r, { entrada, reparto }) => ({
    id: entrada.id,
    cobros: 'codigo' in reparto ? [] : reparto,
  }),
};
