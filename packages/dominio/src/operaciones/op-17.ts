// OP-17 Auto-asignar (01 §5.3, 04 §3.3; P6, supuesto 14 modificado): recorre las categorías activas
// con meta y Falta(c, p) > 0 por orden de grupo y de categoría, y asigna a cada una mín(Falta, máx(0,
// LPA restante)). Nunca deja LPA negativo (inv. 19). AV-18 trae lo que quedó sin cubrir.
import { evaluarMeta } from '../calculo/metas';
import { periodoDe } from '../calculo/periodos';
import type { AvisoOperacion, Cambio, ComandoOp17, Instantanea, Rechazo, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { periodoEditable } from './op-14';
import { ajustar } from './op-09';
import { esRechazo } from './rechazos';

export function op17(antes: Instantanea, x: ComandoOp17): Efecto | Rechazo {
  const { hechos: h } = antes;
  const periodo = periodoEditable(antes, x.periodoInicio);
  if (esRechazo(periodo)) return periodo;
  const p = periodoDe(antes.ciclo, x.periodoInicio);
  const pedidas = x.categorias === undefined ? undefined : new Set(x.categorias);
  const grupo = new Map(h.grupos.map((g) => [g.id, g.orden]));
  const categorias = h.categorias
    .filter((c) => !c.archivada && (pedidas === undefined || pedidas.has(c.id)))
    .sort((a, b) => (grupo.get(a.grupoId) ?? 0) - (grupo.get(b.grupoId) ?? 0) || a.orden - b.orden);
  let restante = antes.lpa.total;
  const cambios: Cambio[] = [];
  const sinCubrir: [Uuid, Centavos][] = [];
  for (const c of categorias) {
    const m = h.metas.find((y) => y.categoriaId === c.id);
    const e = m && evaluarMeta(m, c, antes.presupuesto, antes.ciclo, antes.hoy, p);
    const falta = e?.falta ?? Centavos.cero;
    if (falta <= 0) continue;
    const monto = Centavos.min(falta, Centavos.max(Centavos.cero, restante));
    restante = Centavos.restar(restante, monto);
    cambios.push(...ajustar(h, x.ids, c.id, x.periodoInicio, monto));
    if (monto < falta) sinCubrir.push([c.id, Centavos.restar(falta, monto)]);
  }
  const avisos: AvisoOperacion[] =
    sinCubrir.length === 0
      ? []
      : [
          {
            codigo: 'AV-18',
            momento: 'despues',
            requiereConfirmacion: false,
            datos: Object.fromEntries(sinCubrir),
          },
        ];
  return { cambios, avisos };
}
