// OP-43 Registrar una ocurrencia esperada, de un toque (04 §3.7): natural (`UNIQUE (programada_id, fecha_esperada)`,
// inv. 15). El mismo id de transacción sobre la ocurrencia que ya registró es `ya_aplicada`; una ocurrencia resuelta de
// otra forma la rechaza el dominio (`ocurrencia_ya_resuelta`). La fecha de la transacción es la esperada (B-12). El
// registro automático (tareas/registro-automatico.ts) usa esta definición con `registrarAutomatica` como `aplicar`; el
// desglose propuesto de una cuota lo da `formulario` (CP-10b).
import { op43, type EntradaOp43, type SalidaProgramada } from '../../contratos/programadas.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP43: DefinicionOperacion<EntradaOp43, EntradaOp43, SalidaProgramada> = {
  id: 'OP-43',
  contrato: op43,
  idempotencia: 'natural',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(_tx, e, h) {
    const r = h.ocurrencias_resueltas.find(
      (o) => o.programadaId === e.programadaId && o.fechaEsperada === e.fechaEsperada,
    );
    return r?.estado === 'registrada' && r.transaccionId === e.id
      ? { tipo: 'ya_aplicada', salida: { id: e.id } }
      : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-43',
    programadaId: e.programadaId,
    fechaEsperada: e.fechaEsperada,
    id: e.id,
    instante,
    ids,
    ...(e.monto === undefined ? {} : { monto: e.monto }),
    ...(e.lineas === undefined ? {} : { lineas: e.lineas }),
    ...(e.desglose === undefined ? {} : { desglose: e.desglose }),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
