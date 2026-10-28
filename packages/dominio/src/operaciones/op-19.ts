// OP-19 Cambiar el ciclo (01 §5.3, §4.2 punto 9; 04 §3.3; P7, M5, Q5, CB-12): una vigencia nueva
// (d, R) con R = el inicio del período siguiente al último con asignaciones, y nunca antes del primer
// período futuro. Las vigencias que rigen desde R o después todavía no rigen y no tienen asignaciones
// desde su R: se reemplazan (03 g_vigencia: se eliminan y se inserta la nueva). Una vigencia futura
// con asignaciones en sus períodos queda, porque un período con asignaciones no se redefine (inv. 21).
import { ciclo as cicloDe, periodoDe } from '../calculo/periodos';
import type {
  AvisoOperacion,
  Cambio,
  ComandoOp19,
  Instantanea,
  Rechazo,
  VigenciaCiclo,
} from '../hechos';
import { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';

/** La vigencia de las dadas que rige la fecha f: el mayor "rige desde" ≤ f, o la primera (R₁ = −∞). */
function rigeEn(vigencias: readonly VigenciaCiclo[], f: FechaLocal): VigenciaCiclo {
  const primera = vigencias.find((v) => v.rigeDesde === null);
  if (primera === undefined) throw new RangeError('no hay vigencia sin "rige desde"');
  return vigencias.reduce((m, v) => {
    const desde = v.rigeDesde;
    return desde !== null && desde <= f && (m.rigeDesde === null || desde > m.rigeDesde) ? v : m;
  }, primera);
}

export function op19(antes: Instantanea, x: ComandoOp19): Efecto | Rechazo {
  const { hechos: h, hoy, ciclo } = antes;
  const d = x.diaInicio;
  if (!Number.isInteger(d) || d < 1 || d > 31) throw new TypeError(`OP-19: día de inicio ${d}`);
  if (rigeEn(h.vigencias_ciclo, hoy).diaInicio === d)
    return { codigo: 'ciclo_sin_cambio', datos: { dia: d } };
  // 04 OP-19, idempotencia: si la vigencia que regirá (la última) ya tiene ese día, no cambia nada.
  if (ciclo[ciclo.length - 1]?.diaInicio === d) return { cambios: [] };
  // §4.2 punto 9 y CB-12: el período siguiente al último con asignaciones, o al activo.
  const ultimo = h.asignaciones.reduce(
    (m, a) => (a.periodoInicio > m ? a.periodoInicio : m),
    periodoDe(ciclo, hoy).inicio,
  );
  const r = FechaLocal.sumarDias(periodoDe(ciclo, ultimo).fin, 1);
  const reemplazadas = h.vigencias_ciclo.filter((v) => v.rigeDesde !== null && v.rigeDesde >= r);
  const quedan = h.vigencias_ciclo.filter((v) => !reemplazadas.includes(v));
  // Si la que rige justo antes de R ya tiene el día d, basta con quitar las posteriores.
  const nueva: VigenciaCiclo[] =
    rigeEn(quedan, r).diaInicio === d
      ? []
      : [{ id: x.ids.siguiente(), diaInicio: d, rigeDesde: r, revision: null }];
  const cambios: Cambio[] = [
    ...reemplazadas.map((v): Cambio => ({ tipo: 'eliminar', tabla: 'vigencias_ciclo', id: v.id })),
    ...nueva.map((fila): Cambio => ({ tipo: 'insertar', tabla: 'vigencias_ciclo', fila })),
  ];
  const p = periodoDe(cicloDe([...quedan, ...nueva]), r);
  const transicion = p.transicion ? { transicionInicio: p.inicio, transicionFin: p.fin } : {};
  const av12: AvisoOperacion = {
    codigo: 'AV-12',
    momento: 'antes',
    requiereConfirmacion: true,
    datos: { diaInicio: d, rigeDesde: r, ...transicion },
  };
  return { cambios, avisos: [av12] };
}
