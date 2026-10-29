// OP-18 Crear, editar o eliminar una meta (04 §3.3). Crear: creación (4.6.1), el id existente con los mismos datos es
// `ya_aplicada` y con otros `conflicto_id`. Editar: valor absoluto (4.6.2) sobre los campos que cambian. Eliminar:
// eliminación (4.6.3), una meta que ya no existe pero consta en `eliminaciones` es `ya_aplicada`.
import { fueEliminada } from '@finn/db';
import type { Hechos, Meta } from '@finn/dominio';
import { op18, type EntradaOp18, type SalidaPresupuesto } from '../../contratos/presupuesto.ts';
import type { DefinicionOperacion, Veredicto } from '../marco.ts';

type Crear = Extract<EntradaOp18, { accion: 'crear' }>;
type Editar = Extract<EntradaOp18, { accion: 'editar' }>;

const CLAVES = ['monto', 'modo', 'fechaObjetivo'] as const;
const metaDe = (h: Hechos, id: string): Meta | undefined => h.metas.find((m) => m.id === id);
const igual = (a: Meta, e: Crear): boolean =>
  a.categoriaId === e.categoriaId &&
  a.tipo === e.tipo &&
  a.monto === e.monto &&
  a.modo === (e.modo ?? null) &&
  a.fechaObjetivo === (e.fechaObjetivo ?? null);

function editar(m: Meta, e: Editar): Veredicto<SalidaPresupuesto> {
  const pedidas = CLAVES.filter((k) => e[k] !== undefined);
  if (pedidas.every((k) => m[k] === e[k])) return { tipo: 'ya_aplicada', salida: {} };
  if (pedidas.every((k) => m[k] === e.esperado[k])) return { tipo: 'aplicar' };
  return {
    tipo: 'conflicto_desactualizado',
    actuales: Object.fromEntries(pedidas.map((k) => [k, m[k]])),
  };
}

export const OP18: DefinicionOperacion<EntradaOp18, EntradaOp18, SalidaPresupuesto> = {
  id: 'OP-18',
  contrato: op18,
  idempotencia: 'creacion',
  idPrincipal: (e) => (e.accion === 'crear' ? e.id : e.metaId),
  async comprobarIdempotencia(tx, e, h) {
    if (e.accion === 'crear') {
      const m = metaDe(h, e.id);
      if (m === undefined) return { tipo: 'aplicar' };
      return igual(m, e) ? { tipo: 'ya_aplicada', salida: { id: e.id } } : { tipo: 'conflicto_id' };
    }
    const m = metaDe(h, e.metaId);
    if (m !== undefined) return e.accion === 'editar' ? editar(m, e) : { tipo: 'aplicar' };
    return e.accion === 'eliminar' && (await fueEliminada(tx, 'metas', e.metaId))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando(e) {
    if (e.accion === 'eliminar')
      return { operacion: 'OP-18', accion: 'eliminar', metaId: e.metaId };
    if (e.accion === 'editar')
      return {
        operacion: 'OP-18',
        accion: 'editar',
        metaId: e.metaId,
        ...(e.monto === undefined ? {} : { monto: e.monto }),
        ...(e.modo === undefined ? {} : { modo: e.modo }),
        ...(e.fechaObjetivo === undefined ? {} : { fechaObjetivo: e.fechaObjetivo }),
      };
    return {
      operacion: 'OP-18',
      accion: 'crear',
      id: e.id,
      categoriaId: e.categoriaId,
      tipo: e.tipo,
      monto: e.monto,
      ...(e.modo === undefined ? {} : { modo: e.modo }),
      ...(e.fechaObjetivo === undefined ? {} : { fechaObjetivo: e.fechaObjetivo }),
    };
  },
  salida: (_r, e) => (e.accion === 'crear' ? { id: e.id } : {}),
};
