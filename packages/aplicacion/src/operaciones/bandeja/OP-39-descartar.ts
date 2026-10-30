// OP-39 Descartar o restaurar (04 §3.6): natural (4.6). Restaurar reevalúa emparejamiento y duplicados (pasos 7 y 8 de OP-35).
import { op39, type EntradaOp39, type SalidaMovimiento } from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';
import {
  camposDeMovimiento,
  cargarMovimiento,
  resolverMovimiento,
  type ContextoMovimiento,
} from './comunes.ts';

const RESTAURADOS = new Set(['pendiente', 'con_coincidencia', 'posible_duplicado']);

type Resuelto = ContextoMovimiento & { readonly entrada: EntradaOp39 };

export const OP39: DefinicionOperacion<EntradaOp39, Resuelto, SalidaMovimiento> = {
  id: 'OP-39',
  contrato: op39,
  idempotencia: 'natural',
  async comprobarIdempotencia(tx, e) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    if (c === null) return { tipo: 'no_encontrado' };
    const { estado } = c.movimiento;
    const hecho = e.accion === 'descartar' ? estado === 'descartado' : RESTAURADOS.has(estado);
    return hecho
      ? { tipo: 'ya_aplicada', salida: { movimientoId: e.movimientoId, estado } }
      : { tipo: 'aplicar' };
  },
  async resolver(tx, e) {
    return { ...(await resolverMovimiento(tx, e.movimientoId)), entrada: e };
  },
  comando: ({ movimiento, texto, movimientos, entrada }) =>
    entrada.accion === 'descartar'
      ? { operacion: 'OP-39', movimiento, accion: 'descartar' }
      : { operacion: 'OP-39', movimiento, accion: 'restaurar', texto, movimientos },
  salida: (r, { movimiento }) => ({
    movimientoId: movimiento.id,
    estado: camposDeMovimiento(r.cambios, movimiento.id).estado ?? movimiento.estado,
  }),
};
