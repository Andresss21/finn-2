// OP-37 Aprobar movimiento (04 §3.6): natural (`transaccion_id`) y creación (`transacciones.id`). CF-21 compara las líneas vistas.
import { op37, type EntradaOp37 } from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';
import {
  aprobacionDe,
  camposDeMovimiento,
  cargarMovimiento,
  lineasVistas,
  mismasLineas,
  resolverMovimiento,
  salidaAprobada,
  veredictoDeAprobacion,
  type ContextoMovimiento,
  type SalidaAprobada,
} from './comunes.ts';

type Resuelto = ContextoMovimiento & { readonly entrada: EntradaOp37 };

export const OP37: DefinicionOperacion<EntradaOp37, Resuelto, SalidaAprobada> = {
  id: 'OP-37',
  contrato: op37,
  idempotencia: 'natural',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e, h) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    if (c === null) return { tipo: 'no_encontrado' };
    const previo = veredictoDeAprobacion(c.movimiento, h, e.id);
    if (previo !== undefined) return previo;
    const vistas = lineasVistas(c.lineas);
    return e.categoriaId !== undefined &&
      c.movimiento.estado === 'pendiente' &&
      !mismasLineas(vistas, e.esperado?.lineas ?? [])
      ? { tipo: 'conflicto_desactualizado', actuales: { lineas: vistas } }
      : { tipo: 'aplicar' };
  },
  async resolver(tx, e) {
    return { ...(await resolverMovimiento(tx, e.movimientoId, e)), entrada: e };
  },
  comando: (r, instante, ids) => ({
    operacion: 'OP-37',
    ...aprobacionDe(r, r.entrada, instante, ids),
    ...(r.entrada.categoriaId === undefined ? {} : { categoriaId: r.entrada.categoriaId }),
  }),
  salida: (resultado, { movimiento }) =>
    salidaAprobada(resultado.hechosNuevos, {
      ...movimiento,
      ...camposDeMovimiento(resultado.cambios, movimiento.id),
    }),
};
