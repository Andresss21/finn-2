// OP-13 Eliminar categoría, eliminar grupo o archivar grupo (01 §5.2, 04 §3.2). Solo se elimina lo
// que no tiene historial (inv. 25, H9); un grupo se archiva con todas sus categorías archivadas, y
// "Pagos de tarjeta" lo administra Finn (S3-9).
import type { Cambio, ComandoOp13, Instantanea, Rechazo } from '../hechos';
import { puedeEliminar } from '../selectores/estructura';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

export function op13(antes: Instantanea, x: ComandoOp13): Efecto | Rechazo {
  const { hechos: h } = antes;
  if (x.accion === 'eliminar_categoria') {
    const c = buscar(h.categorias, x.id, 'categorias');
    if (esRechazo(c)) return c;
    const datos = { categoriaId: c.id };
    if (c.clase === 'pago') return { codigo: 'categoria_de_pago_con_tarjeta', datos };
    if (!puedeEliminar(antes, c, x.reglas)) return { codigo: 'categoria_con_historial', datos };
    return { cambios: [{ tipo: 'eliminar', tabla: 'categorias', id: c.id }] }; // su meta, en cascada
  }
  const g = buscar(h.grupos, x.id, 'grupos');
  if (esRechazo(g)) return g;
  const datos = { grupo: g.nombre };
  if (g.claveSistema !== null) return { codigo: 'grupo_del_sistema', datos };
  const propias = h.categorias.filter((c) => c.grupoId === g.id);
  if (x.accion === 'eliminar_grupo')
    return propias.length > 0
      ? { codigo: 'grupo_no_vacio', datos }
      : { cambios: [{ tipo: 'eliminar', tabla: 'grupos', id: g.id }] };
  if (propias.some((c) => !c.archivada)) return { codigo: 'grupo_con_categorias_activas', datos };
  const archivar: Cambio = {
    tipo: 'actualizar',
    tabla: 'grupos',
    id: g.id,
    campos: { archivado: true },
  };
  // Idempotencia natural (04 §4.6): un grupo ya archivado no escribe nada.
  return { cambios: g.archivado ? [] : [archivar] };
}
