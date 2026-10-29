// OP-03 Reordenar cuentas (04 §3.1): valor absoluto. Si el orden actual ya es el pedido, `ya_aplicada`; si la lista
// no trae exactamente las cuentas abiertas, `conflicto_desactualizado` con el orden vigente (4.6.2).
import { op03, type EntradaOp03, type SalidaCuenta } from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { hechosDe } from './comunes.ts';

export const OP03: DefinicionOperacion<EntradaOp03, EntradaOp03, SalidaCuenta> = {
  id: 'OP-03',
  contrato: op03,
  idempotencia: 'valor_absoluto',
  async comprobarIdempotencia(tx, e) {
    const abiertas = (await hechosDe(tx)).cuentas
      .filter((c) => !c.archivada)
      .sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1))
      .map((c) => c.id);
    const pedidas = new Set(e.orden);
    if (
      pedidas.size !== e.orden.length ||
      e.orden.length !== abiertas.length ||
      !abiertas.every((id) => pedidas.has(id))
    )
      return { tipo: 'conflicto_desactualizado', actuales: { orden: abiertas } };
    return abiertas.every((id, i) => e.orden[i] === id)
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({ operacion: 'OP-03', orden: e.orden }),
  salida: () => ({}),
};
