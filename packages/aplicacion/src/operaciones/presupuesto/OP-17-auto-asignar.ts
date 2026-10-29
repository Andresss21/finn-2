// OP-17 Auto-asignar (04 §3.3): valor absoluto sobre la revisión (4.6.2). El resultado depende de todo el estado, así
// que si la revisión que vio la interfaz ya no es la actual es `conflicto_desactualizado`. El dominio nunca deja LPA
// negativo (inv. 19) y AV-18 informa lo que quedó sin cubrir.
import { op17, type EntradaOp17, type SalidaPresupuesto } from '../../contratos/presupuesto.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP17: DefinicionOperacion<EntradaOp17, EntradaOp17, SalidaPresupuesto> = {
  id: 'OP-17',
  contrato: op17,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia: (tx, e) =>
    e.esperado.revision === tx.estado.revision
      ? { tipo: 'aplicar' }
      : { tipo: 'conflicto_desactualizado', actuales: { revision: tx.estado.revision } },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-17',
    periodoInicio: e.periodoInicio,
    ...(e.categorias === undefined ? {} : { categorias: e.categorias }),
    ids,
  }),
  salida: () => ({}),
};
