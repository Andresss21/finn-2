// OP-52 Renombrar deudor (04 §3.5, QB-2): valor absoluto (4.6.2) sobre `deudores.nombre`. El nombre nuevo igual al actual
// es `ya_aplicada`; el actual igual al que vio la interfaz se aplica; cualquier otro es `conflicto_desactualizado`.
import { op52, type EntradaOp52 } from '../../contratos/eventos.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP52: DefinicionOperacion<EntradaOp52, EntradaOp52, Record<string, never>> = {
  id: 'OP-52',
  contrato: op52,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    const deudor = h.deudores.find((d) => d.id === e.deudorId);
    if (deudor === undefined) return { tipo: 'no_encontrado' };
    if (deudor.nombre === e.nombre) return { tipo: 'ya_aplicada', salida: {} };
    if (deudor.nombre === e.esperado.nombre) return { tipo: 'aplicar' };
    return { tipo: 'conflicto_desactualizado', actuales: { nombre: deudor.nombre } };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({ operacion: 'OP-52', deudorId: e.deudorId, nombre: e.nombre }),
  salida: () => ({}),
};
