// OP-40 Resolver coincidencia o posible duplicado (04 §3.6): natural (4.6); confirmar es OP-37.
import type { Movimiento } from '@finn/dominio';
import { op40, type EntradaOp40, type SalidaMovimiento } from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';
import {
  aprobacionDe,
  camposDeMovimiento,
  cargarMovimiento,
  resolverMovimiento,
  salidaAprobada,
  veredictoDeAprobacion,
  type ContextoMovimiento,
} from './comunes.ts';

type Resuelto = ContextoMovimiento & { readonly entrada: EntradaOp40 };

/** ¿Ya está el movimiento en el estado al que lleva la decisión? */
const yaDecidida = (decision: EntradaOp40['decision'], m: Movimiento): boolean =>
  decision === 'rechazar_coincidencia'
    ? (m.estado === 'pendiente' || m.estado === 'posible_duplicado') &&
      m.esperadaProgramadaId === null
    : decision === 'es_legitimo'
      ? m.estado === 'pendiente' &&
        m.duplicadoTransaccionId === null &&
        m.duplicadoMovimientoId === null
      : decision === 'es_duplicado' && m.estado === 'descartado';

export const OP40: DefinicionOperacion<EntradaOp40, Resuelto, SalidaMovimiento> = {
  id: 'OP-40',
  contrato: op40,
  idempotencia: 'natural',
  idPrincipal: (e) => (e.decision === 'confirmar_coincidencia' ? e.id : e.movimientoId),
  async comprobarIdempotencia(tx, e, h) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    if (c === null) return { tipo: 'no_encontrado' };
    if (e.decision === 'confirmar_coincidencia')
      return veredictoDeAprobacion(c.movimiento, h, e.id) ?? { tipo: 'aplicar' };
    return yaDecidida(e.decision, c.movimiento)
      ? {
          tipo: 'ya_aplicada',
          salida: { movimientoId: e.movimientoId, estado: c.movimiento.estado },
        }
      : { tipo: 'aplicar' };
  },
  async resolver(tx, e) {
    const aprobando = e.decision === 'confirmar_coincidencia' ? e : undefined;
    return { ...(await resolverMovimiento(tx, e.movimientoId, aprobando)), entrada: e };
  },
  comando: (r, instante, ids) => {
    const { movimiento, lineas, entrada: e } = r;
    if (e.decision === 'confirmar_coincidencia')
      return { operacion: 'OP-40', decision: e.decision, ...aprobacionDe(r, e, instante, ids) };
    const base = { operacion: 'OP-40', decision: e.decision, movimiento, lineas } as const;
    return e.decision === 'rechazar_coincidencia'
      ? { ...base, decision: e.decision, texto: r.texto, movimientos: r.movimientos }
      : { ...base, decision: e.decision };
  },
  salida: (resultado, { movimiento, entrada }) => {
    const campos = camposDeMovimiento(resultado.cambios, movimiento.id);
    return entrada.decision === 'confirmar_coincidencia'
      ? salidaAprobada(resultado.hechosNuevos, { ...movimiento, ...campos })
      : { movimientoId: movimiento.id, estado: campos.estado ?? movimiento.estado };
  },
};
