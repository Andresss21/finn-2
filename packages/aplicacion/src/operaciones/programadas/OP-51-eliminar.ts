// OP-51 Eliminar una programada sin historial (04 §3.7; HZ-1): eliminación (4.6.3). `resolver` cuenta las referencias
// desde `movimientos` y `sms_procesamientos`; con alguna, o con resoluciones, el dominio rechaza (`programada_con_historial`).
import { contarReferenciasDeProgramada, fueEliminada } from '@finn/db';
import { op51, type EntradaOp51, type SalidaProgramada } from '../../contratos/programadas.ts';
import type { DefinicionOperacion } from '../marco.ts';

type Resuelto = {
  readonly programadaId: EntradaOp51['programadaId'];
  readonly referencias: number;
};

export const OP51: DefinicionOperacion<EntradaOp51, Resuelto, SalidaProgramada> = {
  id: 'OP-51',
  contrato: op51,
  idempotencia: 'eliminacion',
  async comprobarIdempotencia(tx, e, h) {
    if (h.programadas.some((p) => p.id === e.programadaId)) return { tipo: 'aplicar' };
    return (await fueEliminada(tx, 'programadas', e.programadaId))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  async resolver(tx, e) {
    return {
      programadaId: e.programadaId,
      referencias: await contarReferenciasDeProgramada(tx, e.programadaId),
    };
  },
  comando: (r) => ({
    operacion: 'OP-51',
    programadaId: r.programadaId,
    referencias: r.referencias,
  }),
  salida: () => ({}),
};
