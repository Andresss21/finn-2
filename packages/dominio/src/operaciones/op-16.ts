// OP-16 Asignación rápida (01 §5.3, CF-17, CF-25; 04 §3.3, §6.14.4): el dominio calcula el valor de
// Asig(c, p) de la variante y lo aplica con las reglas de OP-14, incluido AV-11. `asignacionRapida`
// da los valores de las variantes que se ofrecen (el `rapida` del contexto de `asignar`).
import { evaluarMeta } from '../calculo/metas';
import { type Periodo, periodoDe } from '../calculo/periodos';
import type { ComandoOp16, Instantanea, Rechazo, Uuid, VarianteAsignacionRapida } from '../hechos';
import { existiaEn } from '../selectores/reportes/existia-en';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { asignado, op14, periodoEditable } from './op-14';
import { esRechazo } from './rechazos';

/** Asig(c, p) resultante de cada variante; una variante que no se ofrece no viene. */
export interface AsignacionRapida {
  /** Asig + Falta(c, p); solo con una meta evaluada. */
  readonly faltaMeta?: Centavos;
  /** Asig(c, p − 1). */
  readonly igualPeriodoAnterior: Centavos;
  /** CF-17: promedio de Gastado en los últimos 3 períodos cerrados en que existía c, o los que haya. */
  readonly promedioGasto?: { readonly monto: Centavos; readonly periodos: 1 | 2 | 3 };
  /** CF-25: Asig + máx(0, −Disp(c, p)); solo si Disp(c, p) < 0. */
  readonly cubrirSobregiro?: Centavos;
}

/** Suma / n en centavos, mitad hacia arriba y simétrico en negativos (como `detalleCategoria`). */
function promedio(total: Centavos, n: number): Centavos {
  const p = Centavos.proporcionMitadArriba(Centavos.max(total, Centavos.negar(total)), 1, n);
  return total < 0 ? Centavos.negar(p) : p;
}

/** Los valores de 01 OP-16 para la categoría en el período p (04 §6.14.4, `rapida`). */
export function asignacionRapida(i: Instantanea, categoriaId: Uuid, p: Periodo): AsignacionRapida {
  const c = i.hechos.categorias.find((x) => x.id === categoriaId);
  if (c === undefined) throw new RangeError(`la categoría ${categoriaId} no existe`);
  const { celdas, activo } = i.presupuesto;
  const asig = asignado(i, categoriaId, p.inicio);
  const anterior = periodoDe(i.ciclo, FechaLocal.sumarDias(p.inicio, -1));
  const m = i.hechos.metas.find((y) => y.categoriaId === categoriaId);
  // Una meta se evalúa en el activo o en un futuro (§4.12).
  const e =
    m === undefined || p.inicio < activo.inicio
      ? null
      : evaluarMeta(m, c, i.presupuesto, i.ciclo, i.hoy, p);
  // Gastado(c, q) = −Act(c, q) existe solo en las categorías normales (§4.4).
  const historial =
    c.clase !== 'normal'
      ? []
      : celdas
          .filter(
            (x) =>
              x.categoriaId === categoriaId &&
              x.estado === 'cerrado' &&
              x.periodo.fin < p.inicio &&
              existiaEn(i, categoriaId, x.periodo),
          )
          .slice(-3);
  const gastado = historial.reduce((s, x) => Centavos.restar(s, x.actividad), Centavos.cero);
  // Fuera del rango calculado, Disp es la proyección con actividad cero: nunca negativa (§4.6).
  const celda = celdas.find((x) => x.categoriaId === categoriaId && x.periodo.inicio === p.inicio);
  const disponible = celda?.disponible ?? Centavos.cero;
  const periodos = historial.length as 1 | 2 | 3;
  return {
    ...(e ? { faltaMeta: Centavos.sumar(asig, e.falta) } : {}),
    igualPeriodoAnterior: asignado(i, categoriaId, anterior.inicio),
    ...(periodos > 0 ? { promedioGasto: { monto: promedio(gastado, periodos), periodos } } : {}),
    ...(disponible < 0 ? { cubrirSobregiro: Centavos.restar(asig, disponible) } : {}),
  };
}

const CAMPO = {
  falta_meta: 'faltaMeta',
  igual_periodo_anterior: 'igualPeriodoAnterior',
  promedio_gasto: 'promedioGasto',
  cubrir_sobregiro: 'cubrirSobregiro',
} as const satisfies Record<VarianteAsignacionRapida, keyof AsignacionRapida>;

export function op16(antes: Instantanea, x: ComandoOp16): Efecto | Rechazo {
  const c = buscar(antes.hechos.categorias, x.categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  const periodo = periodoEditable(antes, x.periodoInicio);
  if (esRechazo(periodo)) return periodo;
  const valor = asignacionRapida(antes, c.id, periodoDe(antes.ciclo, x.periodoInicio))[
    CAMPO[x.variante]
  ];
  // 04 §6.14.4: la interfaz ofrece solo las variantes que vienen; pedir otra es un comando mal formado.
  if (valor === undefined)
    throw new TypeError(`OP-16: ${x.variante} no se ofrece para ${c.id} en ${x.periodoInicio}`);
  const montoNuevo = typeof valor === 'object' ? valor.monto : valor;
  const { categoriaId, periodoInicio, ids } = x;
  return op14(antes, { operacion: 'OP-14', categoriaId, periodoInicio, montoNuevo, ids });
}
