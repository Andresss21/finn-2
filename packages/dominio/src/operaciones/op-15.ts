// OP-15 Mover dinero entre categorías (01 §5.3, 04 §3.3; YNAB): Asig(o, p) −= X, Asig(d, p) += X en
// un período activo o futuro. LPA no cambia, así que AV-11 nunca se produce. Si X > Disp(o, p), o
// queda sobregirada. Desde una archivada equivale a OP-11: X ≤ Disp(o, p).
import type { ComandoOp15, Instantanea, Rechazo } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { periodoEditable } from './op-14';
import { buscar } from './op-07';
import { ajustar } from './op-09';
import { esRechazo } from './rechazos';

/** Disp(c, p); después de la proyección cada período repite el último (TA-235). */
function disponibleEn(i: Instantanea, categoriaId: string, inicio: string) {
  const propias = i.presupuesto.celdas.filter((x) => x.categoriaId === categoriaId);
  const x = propias.find((y) => y.periodo.inicio === inicio) ?? propias[propias.length - 1];
  return x?.disponible ?? Centavos.cero;
}

export function op15(antes: Instantanea, x: ComandoOp15): Efecto | Rechazo {
  const { hechos: h } = antes;
  if (x.monto <= 0) throw new TypeError(`OP-15: monto ${x.monto}`);
  const o = buscar(h.categorias, x.origenId, 'categorias');
  if (esRechazo(o)) return o;
  const d = buscar(h.categorias, x.destinoId, 'categorias');
  if (esRechazo(d)) return d;
  const datos = { categoriaId: d.id };
  if (d.id === o.id) return { codigo: 'destino_igual_origen', datos };
  if (d.archivada) return { codigo: 'categoria_archivada', datos };
  const periodo = periodoEditable(antes, x.periodoInicio);
  if (esRechazo(periodo)) return periodo;
  const disponible = disponibleEn(antes, o.id, x.periodoInicio);
  if (o.archivada && x.monto > disponible)
    return { codigo: 'monto_mayor_que_disponible', datos: { categoriaId: o.id, disponible } };
  return {
    cambios: [
      ...ajustar(h, x.ids, o.id, x.periodoInicio, Centavos.negar(x.monto)),
      ...ajustar(h, x.ids, d.id, x.periodoInicio, x.monto),
    ],
  };
}
