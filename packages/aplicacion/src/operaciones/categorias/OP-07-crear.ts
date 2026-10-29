// OP-07 Crear grupo o categoría (04 §3.2): creación (4.6.1). El id existente con los mismos datos es `ya_aplicada`;
// con otros, `conflicto_id`. Nombre repetido, grupo archivado y grupo del sistema los rechaza el dominio.
import { op07, type EntradaOp07, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe, grupoDe } from './comunes.ts';

export const OP07: DefinicionOperacion<EntradaOp07, EntradaOp07, SalidaCategoria> = {
  id: 'OP-07',
  contrato: op07,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(_tx, e, h) {
    if (e.tipo === 'grupo') {
      const g = grupoDe(h, e.id);
      if (g === undefined) return { tipo: 'aplicar' };
      return g.nombre === e.nombre
        ? { tipo: 'ya_aplicada', salida: { id: e.id } }
        : { tipo: 'conflicto_id' };
    }
    const c = categoriaDe(h, e.id);
    if (c === undefined) return { tipo: 'aplicar' };
    return c.nombre === e.nombre && c.grupoId === e.grupoId
      ? { tipo: 'ya_aplicada', salida: { id: e.id } }
      : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-07',
    tipo: e.tipo,
    id: e.id,
    nombre: e.nombre,
    ...(e.tipo === 'categoria' ? { grupoId: e.grupoId } : {}),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
