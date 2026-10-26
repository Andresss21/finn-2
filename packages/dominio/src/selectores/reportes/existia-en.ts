// `existiaEn(c, q)` (04 §6.0.5, CF-17; 06 §3.14): c existía en q si hay una asignación distinta de
// cero, un consumo, una entrada o un evento de devolución con fecha en q (la de la transacción o la
// del evento, N3). Una categoría archivada cuenta igual (N5); los períodos de transición también.
import { asignado } from '../../calculo/d2';
import type { Periodo } from '../../calculo/periodos';
import type { Instantanea, Uuid } from '../../hechos';
import { contexto, dentro } from './comunes';

export function existiaEn(i: Instantanea, categoriaId: Uuid, q: Periodo): boolean {
  const cx = contexto(i);
  return (
    asignado(i.hechos.asignaciones, categoriaId, q) !== 0 ||
    cx.consumos.some((x) => x.categoriaId === categoriaId && dentro(q, x.fecha)) ||
    cx.devoluciones.some((x) => x.categoriaId === categoriaId && dentro(q, x.fecha))
  );
}
