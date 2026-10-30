// OP-43 Registrar una ocurrencia esperada, de un toque (04 §3.7): natural (`UNIQUE (programada_id, fecha_esperada)`,
// inv. 15). El mismo id de transacción sobre la ocurrencia que ya registró es `ya_aplicada`; una ocurrencia resuelta de
// otra forma la rechaza el dominio (`ocurrencia_ya_resuelta`). La fecha de la transacción es la esperada (B-12). El
// registro automático (tareas/registro-automatico.ts) usa esta misma definición, con `registrarAutomatica` como `aplicar`.
import { calcular } from '@finn/dominio';
import { desglosePropuesto } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
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
  /** Una cuota: el desglose del modelo para esa fecha (Anexo A.2 punto 8), o vacío si ninguna cuota coincide. */
  proponer(tx, e, h) {
    const p = h.programadas.find((x) => x.id === e.programadaId);
    if (p?.tipo !== 'cuota_prestamo' || p.cuentaDestinoId === null) return undefined;
    const i = calcular(h, FechaLocal.desdeTexto(tx.estado.hoy));
    return desglosePropuesto(i, p.cuentaDestinoId, e.fechaEsperada) ?? {};
  },
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
