// OP-18 Crear, editar o eliminar una meta (01 §5.3, 04 §3.3; P6, N8, O5, I2). La forma de la meta
// por tipo es contrato (03 ck_metas_*): un comando que la rompe lanza. "Extender la fecha" y
// "ajustar el monto" de una vencida son ediciones: la fecha ≥ hoy se exige solo al crear (CB-27).
import type { Categoria, ComandoOp18, Hechos, Instantanea, Meta, Rechazo } from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

type Forma = Pick<Meta, 'tipo' | 'modo' | 'monto' | 'fechaObjetivo'>;

/** ck_metas_monto, ck_metas_modo, ck_metas_fecha_para y ck_metas_fecha_periodo. */
function verificarForma(m: Forma) {
  const porPeriodo = m.tipo === 'mensual' || m.tipo === 'semanal';
  const valida =
    m.monto > 0 &&
    porPeriodo === (m.modo !== null) &&
    (m.tipo !== 'para_fecha' || m.fechaObjetivo !== null) &&
    (!porPeriodo || m.fechaObjetivo === null);
  if (!valida) throw new TypeError(`OP-18: meta ${JSON.stringify(m)}`);
}

/** Categoría normal y activa (I2, inv. 20, 23). */
function categoriaValida(h: Hechos, categoriaId: Meta['categoriaId']): Categoria | Rechazo {
  const c = buscar(h.categorias, categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  const datos = { categoriaId: c.id };
  if (c.clase === 'pago') return { codigo: 'meta_en_categoria_de_pago', datos };
  return c.archivada ? { codigo: 'categoria_archivada', datos } : c;
}

export function op18(antes: Instantanea, x: ComandoOp18): Efecto | Rechazo {
  const { hechos: h, hoy } = antes;
  if (x.accion === 'crear') {
    const fila: Meta = {
      id: x.id,
      categoriaId: x.categoriaId,
      tipo: x.tipo,
      modo: x.modo ?? null,
      monto: x.monto,
      fechaObjetivo: x.fechaObjetivo ?? null,
      fechaCreacion: hoy,
      revision: null,
    };
    verificarForma(fila);
    const c = categoriaValida(h, x.categoriaId);
    if (esRechazo(c)) return c;
    if (h.metas.some((m) => m.categoriaId === c.id))
      return { codigo: 'meta_ya_existe', datos: { categoriaId: c.id } };
    if (fila.tipo === 'para_fecha' && fila.fechaObjetivo !== null && fila.fechaObjetivo < hoy)
      return { codigo: 'fecha_objetivo_pasada', campo: 'fechaObjetivo', datos: { hoy } };
    return { cambios: [{ tipo: 'insertar', tabla: 'metas', fila }] };
  }
  const m = buscar(h.metas, x.metaId, 'metas');
  if (esRechazo(m)) return m;
  if (x.accion === 'eliminar') return { cambios: [{ tipo: 'eliminar', tabla: 'metas', id: m.id }] };
  const campos = {
    ...(x.monto !== undefined && { monto: x.monto }),
    ...(x.modo !== undefined && { modo: x.modo }),
    ...(x.fechaObjetivo !== undefined && { fechaObjetivo: x.fechaObjetivo }),
  };
  verificarForma({ ...m, ...campos });
  const c = categoriaValida(h, m.categoriaId);
  if (esRechazo(c)) return c;
  return { cambios: [{ tipo: 'actualizar', tabla: 'metas', id: m.id, campos }] };
}
