// OP-11 Sacar el Disponible de una categoría archivada (01 §5.2, inv. 20; 04 §3.2): 0 < monto ≤
// Disp(c, A), hacia una categoría activa o LPA. AV-14 se resuelve solo cuando Disp(c, A) llega a 0.
import type { ComandoOp11, Instantanea, Rechazo } from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { disponibleEnA, mover } from './op-09';
import { esRechazo } from './rechazos';

export function op11(antes: Instantanea, x: ComandoOp11): Efecto | Rechazo {
  const c = buscar(antes.hechos.categorias, x.categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  if (x.monto <= 0) throw new TypeError(`OP-11: monto ${x.monto}`);
  if (!c.archivada) return { codigo: 'categoria_no_archivada', datos: { categoriaId: c.id } };
  const disponible = disponibleEnA(antes, c.id);
  if (x.monto > disponible)
    return { codigo: 'monto_mayor_que_disponible', datos: { categoriaId: c.id, disponible } };
  const cambios = mover(antes, x.ids, c.id, x.destino, x.monto);
  return esRechazo(cambios) ? cambios : { cambios };
}
