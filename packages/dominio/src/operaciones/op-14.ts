// OP-14 Asignar o desasignar (01 §5.3, 04 §3.3; H4, I1, supuesto 6): valor absoluto sobre Asig(c, p)
// en un período activo o futuro. Aquí vive también la regla de período que reusan OP-15 y OP-17.
import { estadoDe, periodoDe } from '../calculo/periodos';
import type { AvisoOperacion, ComandoOp14, Instantanea, Rechazo, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { ajustar } from './op-09';
import { esRechazo } from './rechazos';

/** El estado de p si es el inicio de un período activo o futuro (§4.2, inv. 18). */
export function periodoEditable(i: Instantanea, inicio: FechaLocal): { futuro: boolean } | Rechazo {
  const p = periodoDe(i.ciclo, inicio);
  if (p.inicio !== inicio) return { codigo: 'periodo_no_valido', datos: { periodoInicio: inicio } };
  const estado = estadoDe(p, i.hoy);
  return estado === 'cerrado'
    ? { codigo: 'periodo_cerrado', datos: { periodoInicio: inicio } }
    : { futuro: estado === 'futuro' };
}

/** Asig(c, p) en los hechos (DM-2: un monto neto por celda). */
export const asignado = (i: Instantanea, categoriaId: Uuid, inicio: FechaLocal) =>
  i.hechos.asignaciones.find((a) => a.categoriaId === categoriaId && a.periodoInicio === inicio)
    ?.monto ?? Centavos.cero;

export function op14(antes: Instantanea, x: ComandoOp14): Efecto | Rechazo {
  const c = buscar(antes.hechos.categorias, x.categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  const periodo = periodoEditable(antes, x.periodoInicio);
  if (esRechazo(periodo)) return periodo;
  const delta = Centavos.restar(x.montoNuevo, asignado(antes, c.id, x.periodoInicio));
  if (delta > 0 && c.archivada)
    return { codigo: 'categoria_archivada', datos: { categoriaId: c.id } };
  // Una asignación en p activo o futuro solo resta de LPA: los cierres no cambian (§4.9).
  const lpa = Centavos.restar(antes.lpa.total, delta);
  const avisos: AvisoOperacion[] = [];
  // I1 e inv. 19 limitan las asignaciones: desasignar en un futuro sube LPA y no se bloquea (CB-10).
  if (delta > 0 && lpa < 0) {
    if (periodo.futuro)
      return { codigo: 'lpa_negativo_en_futuro', datos: { faltante: Centavos.negar(lpa) } };
    avisos.push({ codigo: 'AV-11', momento: 'antes', requiereConfirmacion: true, datos: { lpa } });
  }
  return { cambios: ajustar(antes.hechos, x.ids, c.id, x.periodoInicio, delta), avisos };
}
