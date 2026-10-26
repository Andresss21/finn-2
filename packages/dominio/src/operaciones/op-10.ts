// OP-10 Desarchivar categoría (01 §5.2, §7.6; 04 §3.2): con su grupo, si se pide (A-1). Una de pago
// se desarchiva solo con su tarjeta (OP-05). Su meta vuelve a evaluarse (CB-34).
import type { Cambio, ComandoOp10, Instantanea, Rechazo } from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

export function op10(antes: Instantanea, x: ComandoOp10): Efecto | Rechazo {
  const { hechos: h } = antes;
  const c = buscar(h.categorias, x.categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  const datos = { categoriaId: c.id };
  if (c.clase === 'pago') return { codigo: 'categoria_de_pago_con_tarjeta', datos };
  if (!c.archivada) return { codigo: 'categoria_no_archivada', datos };
  const g = h.grupos.find((y) => y.id === c.grupoId);
  const cambios: Cambio[] = [];
  if (g?.archivado === true) {
    if (x.desarchivarGrupo !== true)
      return { codigo: 'grupo_archivado', datos: { grupo: g.nombre } };
    cambios.push({ tipo: 'actualizar', tabla: 'grupos', id: g.id, campos: { archivado: false } });
  }
  cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: c.id, campos: { archivada: false } });
  return { cambios };
}
