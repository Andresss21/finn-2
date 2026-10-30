// OP-44 Omitir una ocurrencia (04 §3.7; A-6): natural. La ocurrencia ya omitida es `ya_aplicada`; una registrada o una
// fecha que no es ocurrencia las rechaza el dominio. El id de la resolución lo pone la aplicación (BE-31).
import { op44, type EntradaOp44, type SalidaProgramada } from '../../contratos/programadas.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP44: DefinicionOperacion<EntradaOp44, EntradaOp44, SalidaProgramada> = {
  id: 'OP-44',
  contrato: op44,
  idempotencia: 'natural',
  comprobarIdempotencia(_tx, e, h) {
    const omitida = h.ocurrencias_resueltas.some(
      (o) =>
        o.programadaId === e.programadaId &&
        o.fechaEsperada === e.fechaEsperada &&
        o.estado === 'omitida',
    );
    return omitida ? { tipo: 'ya_aplicada', salida: {} } : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-44',
    id: ids.siguiente(),
    programadaId: e.programadaId,
    fechaEsperada: e.fechaEsperada,
  }),
  salida: () => ({}),
};
