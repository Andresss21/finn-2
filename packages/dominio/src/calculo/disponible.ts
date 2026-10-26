// Disponible, arrastre y cierre (01 §4.6; §4.1 conv. 3 a 5; C1, C2, H5, N5, CB-11). Recorre los
// períodos del más antiguo al más reciente y, dentro de cada uno, en el orden de §4.1 conv. 4:
// reparto D2 de las categorías normales, su Disponible, el de las categorías de pago (que reciben los
// traslados del reparto) y el arrastre al período siguiente. Una categoría archivada sigue las
// mismas reglas (N5): no se filtra en ningún paso.
import type { Asignacion, Categoria, Hechos, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { actividadDePago, actividadNormal } from './actividad';
import { asignado, noCubiertaDe, type RepartoD2, repartoD2, trasladoA } from './d2';
import { type Aporte, aportes, consumos, type HechosDeConsumo } from './devoluciones';
import { mutante } from './mutantes';
import {
  type Ciclo,
  type EstadoDePeriodo,
  estadoDe,
  type Periodo,
  periodoDe,
  periodosEntre,
} from './periodos';

export type HechosDePresupuesto = HechosDeConsumo & Pick<Hechos, 'categorias' | 'asignaciones'>;

/** Pago implícito R de un cobro en la tarjeta t (§4.10): Disp(pago(t)) −R en el período del cobro. */
export interface PagoImplicito {
  readonly tarjetaId: Uuid;
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
}

/** Una categoría en un período. */
export interface Celda {
  readonly categoriaId: Uuid;
  readonly clase: Categoria['clase'];
  /** La tarjeta t de pago(t); `null` en una categoría normal. */
  readonly tarjetaId: Uuid | null;
  readonly periodo: Periodo;
  readonly estado: EstadoDePeriodo;
  /** Arr(c, p) = máx(0, Disp(c, p − 1)); 0 en el primer período. */
  readonly arrastre: Centavos;
  readonly asignado: Centavos;
  readonly actividad: Centavos;
  /** Disp(c, p) = Arr + Asig + Act. */
  readonly disponible: Centavos;
  /** Reinicio N(c, p) = máx(0, −Disp): lo que vuelve a cero al pasar al período siguiente. */
  readonly reinicio: Centavos;
  /** SobT(c, p) y SobD(c, p) del reparto D2 (§4.5); 0 en una categoría de pago. */
  readonly sobT: Centavos;
  readonly sobD: Centavos;
}

export interface Presupuesto {
  /** Del más antiguo con algún hecho o asignación hasta el activo o la última asignación. */
  readonly periodos: readonly Periodo[];
  readonly activo: Periodo;
  /** En orden de evaluación: por período; dentro de él, las normales y después las de pago. */
  readonly celdas: readonly Celda[];
  readonly repartos: readonly RepartoD2[];
  /** Aportes D-2 a D-4, cada D-3 con U_L del reparto del período de L. */
  readonly aportes: readonly Aporte[];
  readonly pagosImplicitos: readonly PagoImplicito[];
}

const en = (p: Periodo, fecha: FechaLocal) => p.inicio <= fecha && fecha <= p.fin;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const negativo = (x: Centavos) => Centavos.max(Centavos.cero, Centavos.negar(x));

/** Primer y último período: §4.1 conv. 5 y las asignaciones futuras (proyección, §4.6). */
function rango(
  h: HechosDePresupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  implicitos: readonly PagoImplicito[],
) {
  const fechas = [
    hoy,
    ...h.transacciones.map((t) => t.fecha),
    ...h.condonaciones.map((x) => x.fecha),
    ...h.asignaciones.map((a: Asignacion) => a.periodoInicio),
    ...implicitos.map((x) => x.fecha),
  ];
  const desde = fechas.reduce((a, b) => (b < a ? b : a));
  const hasta = fechas.reduce((a, b) => (b > a ? b : a));
  return periodosEntre(c, periodoDe(c, desde).inicio, hasta);
}

/**
 * Disponible de toda categoría en todo período (§4.6). Los aportes de p se calculan con los
 * repartos de los períodos ya evaluados: la D-3 solo pide U_L de un período anterior (el de L), y
 * `noCubiertaDe` daría 0 para una línea aún sin reparto.
 */
export function presupuesto(
  h: HechosDePresupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  pagosImplicitos: readonly PagoImplicito[] = [],
): Presupuesto {
  const periodos = rango(h, c, hoy, pagosImplicitos);
  const normales = h.categorias.filter((x) => x.clase === 'normal');
  const dePago = h.categorias.filter((x) => x.clase === 'pago');
  const ks = consumos(h, c);
  const arrastres = new Map<Uuid, Centavos>();
  const celdas: Celda[] = [];
  const repartos: RepartoD2[] = [];
  const todos: Aporte[] = [];

  for (const p of periodos) {
    const estado = estadoDe(p, hoy);
    const deP = aportes(h, c, noCubiertaDe(repartos)).filter((d) => d.periodo === p.inicio);
    todos.push(...deP);
    const arrastreDe = (x: Categoria) => arrastres.get(x.id) ?? Centavos.cero;
    const celdaDe = (
      x: Categoria,
      act: Centavos,
      sobT = Centavos.cero,
      sobD = Centavos.cero,
    ): Celda => {
      const arrastre = arrastreDe(x);
      const asig = asignado(h.asignaciones, x.id, p);
      const disponible = Centavos.sumar(Centavos.sumar(arrastre, asig), act);
      return {
        categoriaId: x.id,
        clase: x.clase,
        tarjetaId: x.tarjetaId,
        periodo: p,
        estado,
        arrastre,
        asignado: asig,
        actividad: act,
        disponible,
        reinicio: negativo(disponible),
        sobT,
        sobD,
      };
    };

    // Pasos 1 y 2: reparto D2 y Disponible de cada categoría normal.
    const delPeriodo: RepartoD2[] = [];
    const siguientes: Celda[] = [];
    for (const x of normales) {
      const r = repartoD2({
        categoriaId: x.id,
        periodo: p,
        consumos: ks,
        aportes: deP,
        arrastre: arrastreDe(x),
        asignado: asignado(h.asignaciones, x.id, p),
      });
      delPeriodo.push(r);
      siguientes.push(celdaDe(x, actividadNormal(ks, deP, x.id, p), r.sobT, r.sobD));
    }
    // Paso 3: categorías de pago, con los traslados del paso 1 y los pagos implícitos.
    for (const x of dePago) {
      const t = x.tarjetaId;
      const implicito = suma(
        pagosImplicitos.filter((i) => i.tarjetaId === t && en(p, i.fecha)).map((i) => i.monto),
      );
      const traslado = t === null ? Centavos.cero : trasladoA(delPeriodo, t, p);
      const act = Centavos.sumar(
        Centavos.restar(traslado, implicito),
        actividadDePago(h, deP, x, p),
      );
      siguientes.push(celdaDe(x, act));
    }
    // Paso 4: arrastre al período siguiente. Mutante 'arrastre' (07 §19.4): arrastra el negativo
    // de una categoría normal.
    for (const y of siguientes)
      arrastres.set(
        y.categoriaId,
        mutante('arrastre') && y.clase === 'normal'
          ? y.disponible
          : Centavos.max(Centavos.cero, y.disponible),
      );
    repartos.push(...delPeriodo);
    celdas.push(...siguientes);
  }

  const activo = periodoDe(c, hoy);
  return { periodos, activo, celdas, repartos, aportes: todos, pagosImplicitos };
}

/** La celda de la categoría en el período que contiene `fecha`. */
export function celda(b: Presupuesto, categoriaId: Uuid, fecha: FechaLocal): Celda {
  const x = b.celdas.find((y) => y.categoriaId === categoriaId && en(y.periodo, fecha));
  if (x === undefined) throw new RangeError(`sin celda para ${categoriaId} en ${fecha}`);
  return x;
}

/**
 * Lo que una celda reduce de LPA al cerrar su período: SobD(c, p) en una categoría normal (SobT
 * queda solo en la deuda de la tarjeta, C1 y C2) y E(t, p) = N(pago(t), p) en una de pago (H5).
 */
export const reduccionDe = (x: Celda): Centavos => (x.clase === 'pago' ? x.reinicio : x.sobD);

/** Efectos del cierre: Σ de `reduccionDe` en los períodos cerrados, archivadas incluidas (CB-11). */
export const reduccionAlCierre = (b: Presupuesto): Centavos =>
  suma(b.celdas.filter((x) => x.estado === 'cerrado').map(reduccionDe));
