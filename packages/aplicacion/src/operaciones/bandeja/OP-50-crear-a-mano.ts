// OP-50 Crear la transacción a mano desde un SMS con error (04 §3.6, N-02): es OP-37 sobre un movimiento en `error`,
// con la misma entrada, idempotencia y salida (CP-15). El dominio rechaza con `movimiento_estado_no_valido` el que no
// está en `error`.
import { op50, type EntradaOp50 } from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';
import {
  aprobacionDe,
  camposDeMovimiento,
  cargarMovimiento,
  resolverMovimiento,
  salidaAprobada,
  veredictoDeAprobacion,
  type ContextoMovimiento,
  type SalidaAprobada,
} from './comunes.ts';

type Resuelto = ContextoMovimiento & { readonly entrada: EntradaOp50 };

export const OP50: DefinicionOperacion<EntradaOp50, Resuelto, SalidaAprobada> = {
  id: 'OP-50',
  contrato: op50,
  idempotencia: 'natural',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e, h) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    return c === null
      ? { tipo: 'no_encontrado' }
      : (veredictoDeAprobacion(c.movimiento, h, e.id) ?? { tipo: 'aplicar' });
  },
  async resolver(tx, e) {
    return { ...(await resolverMovimiento(tx, e.movimientoId, e)), entrada: e };
  },
  comando: (r, instante, ids) => ({
    operacion: 'OP-50',
    ...aprobacionDe(r, r.entrada, instante, ids),
  }),
  salida: (resultado, { movimiento }) =>
    salidaAprobada(resultado.hechosNuevos, {
      ...movimiento,
      ...camposDeMovimiento(resultado.cambios, movimiento.id),
    }),
};
