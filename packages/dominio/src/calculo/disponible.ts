// Disponible, arrastre y cierre (01 §4.6; §4.1 conv. 3 a 5; C1, C2, H5, N5, CB-11). Recorre los
// períodos del más antiguo al más reciente y, dentro de cada uno, en el orden de §4.1 conv. 4:
// reparto D2 de las categorías normales, su Disponible, el de las categorías de pago (que reciben los
// traslados del reparto) y el arrastre al período siguiente. Una categoría archivada sigue las
// mismas reglas (N5): no se filtra en ningún paso.
import type { Asignacion, Categoria, Hechos, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { actividadDePago, actividadNormal } from './actividad';
import { asignado, type RepartoD2, repartoD2, trasladoA } from './d2';
import { type Aporte, aportesDe, type HechosDeConsumo, movimientos } from './devoluciones';
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
  /**
   * Del más antiguo con algún hecho o asignación hasta el activo o la última asignación, más los
   * `proyectados` períodos siguientes (proyección con actividad cero, §4.6).
   */
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

/** Las filas de `xs` por su clave, en su orden; las de clave `undefined` no entran. */
export function agrupar<T, K>(xs: readonly T[], claveDe: (x: T) => K | undefined): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of xs) {
    const k = claveDe(x);
    if (k === undefined) continue;
    const ys = m.get(k);
    if (ys === undefined) m.set(k, [x]);
    else ys.push(x);
  }
  return m;
}

/** Las filas de `xs` por celda: [inicio del período, categoría o tarjeta]. Sin período no entran. */
function porCelda<T>(
  xs: readonly T[],
  celda: (x: T) => readonly [FechaLocal | undefined, Uuid | null],
) {
  const m = new Map<FechaLocal, Map<Uuid | null, T[]>>();
  for (const x of xs) {
    const [inicio, id] = celda(x);
    if (inicio === undefined) continue;
    let deP = m.get(inicio);
    if (deP === undefined) m.set(inicio, (deP = new Map<Uuid | null, T[]>()));
    const ys = deP.get(id);
    if (ys === undefined) deP.set(id, [x]);
    else ys.push(x);
  }
  return m;
}

/** El inicio del período de `periodos` que contiene `fecha`, o `undefined`. `periodos` sale de
 * `periodosEntre`: en orden, sin huecos ni solapes (§4.2), así que hay a lo sumo uno. */
function inicioEn(periodos: readonly Periodo[], fecha: FechaLocal): FechaLocal | undefined {
  let bajo = 0;
  let alto = periodos.length - 1;
  while (bajo <= alto) {
    const medio = (bajo + alto) >> 1;
    const p = periodos[medio] as Periodo;
    if (fecha < p.inicio) alto = medio - 1;
    else if (fecha > p.fin) bajo = medio + 1;
    else return p.inicio;
  }
  return undefined;
}

/**
 * Primer y último período: §4.1 conv. 5 y las asignaciones futuras (proyección, §4.6), más
 * `proyectados` períodos posteriores al último con datos. Esos no tienen hechos ni asignaciones:
 * con la misma fórmula dan Arr = máx(0, Disp anterior) y Asig = Act = 0.
 */
function rango(
  h: HechosDePresupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  implicitos: readonly PagoImplicito[],
  proyectados: number,
) {
  const fechas = [
    hoy,
    ...h.transacciones.map((t) => t.fecha),
    ...h.condonaciones.map((x) => x.fecha),
    ...h.asignaciones.map((a: Asignacion) => a.periodoInicio),
    ...implicitos.map((x) => x.fecha),
  ];
  const desde = fechas.reduce((a, b) => (b < a ? b : a));
  let hasta = fechas.reduce((a, b) => (b > a ? b : a));
  for (let k = 0; k < proyectados; k++) hasta = FechaLocal.sumarDias(periodoDe(c, hasta).fin, 1);
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
  proyectados = 0,
  m = movimientos(h, c),
): Presupuesto {
  const periodos = rango(h, c, hoy, pagosImplicitos, proyectados);
  const normales = h.categorias.filter((x) => x.clase === 'normal');
  const dePago = h.categorias.filter((x) => x.clase === 'pago');
  const { consumos: ks, devoluciones } = m;
  const arrastres = new Map<Uuid, Centavos>();
  const celdas: Celda[] = [];
  const repartos: RepartoD2[] = [];
  const todos: Aporte[] = [];

  // Índices de una pasada [BE-23]: cada celda lee sus filas de un Map por período y categoría (o
  // tarjeta). Las fórmulas son las mismas y siguen filtrando: solo reciben las filas de su celda.
  const inicio = (fecha: FechaLocal) => inicioEn(periodos, fecha);
  const consumosDe = porCelda(ks, (k) => [inicio(k.fecha), k.categoriaId]);
  const asignacionesDe = porCelda(h.asignaciones, (a) => [a.periodoInicio, a.categoriaId]);
  const implicitosDe = porCelda(pagosImplicitos, (i) => [inicio(i.fecha), i.tarjetaId]);
  const pagos = new Map(
    h.transacciones.filter((t) => t.tipo === 'pago_tarjeta').map((t) => [t.id, t]),
  );
  const lineasDePago = porCelda(
    h.lineas.filter((l) => pagos.has(l.transaccionId)),
    (l) => [inicio((pagos.get(l.transaccionId) as Transaccion).fecha), l.categoriaId],
  );
  const devolucionesDe = agrupar(devoluciones, (d) => d.periodo);
  // A_L de una D-3 sale de las D-3 anteriores de su L (§4.4): las de L, en orden cronológico.
  const d3De = agrupar(devoluciones, (d) =>
    d.caso === 'D-3' && d.lineaOriginalId !== null ? d.lineaOriginalId : undefined,
  );
  // U_L de los repartos ya evaluados: `noCubiertaDe(repartos)`, armado a medida que se agregan.
  const u = new Map<Uuid, Centavos>();
  const noCubierta = (lineaId: Uuid) => u.get(lineaId) ?? Centavos.cero;

  for (const p of periodos) {
    const estado = estadoDe(p, hoy);
    const propias = devolucionesDe.get(p.inicio) ?? [];
    const deL = new Set(propias.map((d) => d.lineaOriginalId));
    const previas = [...d3De].flatMap(([l, ds]) =>
      deL.has(l) ? ds.filter((d) => d.periodo < p.inicio) : [],
    );
    const deP = aportesDe([...previas, ...propias], noCubierta).filter(
      (d) => d.periodo === p.inicio,
    );
    todos.push(...deP);
    const aportesA = agrupar(deP, (d) => d.categoriaId);
    const aportesEn = agrupar(deP, (d) => d.tarjetaId);
    const deCelda = <T>(ix: Map<FechaLocal, Map<Uuid | null, T[]>>, id: Uuid | null): T[] =>
      ix.get(p.inicio)?.get(id) ?? [];
    const arrastreDe = (x: Categoria) => arrastres.get(x.id) ?? Centavos.cero;
    const asignadoA = (x: Categoria) => asignado(deCelda(asignacionesDe, x.id), x.id, p);
    const celdaDe = (
      x: Categoria,
      act: Centavos,
      sobT = Centavos.cero,
      sobD = Centavos.cero,
    ): Celda => {
      const arrastre = arrastreDe(x);
      const asig = asignadoA(x);
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
      const deC = deCelda(consumosDe, x.id);
      const aportesDeC = aportesA.get(x.id) ?? [];
      const r = repartoD2({
        categoriaId: x.id,
        periodo: p,
        consumos: deC,
        aportes: aportesDeC,
        arrastre: arrastreDe(x),
        asignado: asignadoA(x),
        ordenados: true,
      });
      delPeriodo.push(r);
      siguientes.push(celdaDe(x, actividadNormal(deC, aportesDeC, x.id, p), r.sobT, r.sobD));
    }
    // Paso 3: categorías de pago, con los traslados del paso 1 y los pagos implícitos.
    for (const x of dePago) {
      const t = x.tarjetaId;
      const implicito = suma(
        deCelda(implicitosDe, t)
          .filter((i) => i.tarjetaId === t && en(p, i.fecha))
          .map((i) => i.monto),
      );
      const traslado = t === null ? Centavos.cero : trasladoA(delPeriodo, t, p);
      const lineas = deCelda(lineasDePago, x.id);
      const transacciones = lineas.map((l) => pagos.get(l.transaccionId) as Transaccion);
      const act = Centavos.sumar(
        Centavos.restar(traslado, implicito),
        actividadDePago({ transacciones, lineas }, aportesEn.get(t) ?? [], x, p),
      );
      siguientes.push(celdaDe(x, act));
    }
    // U_L de los consumos de p que son la L de alguna D-3, para los períodos siguientes.
    if (d3De.size > 0)
      for (const r of delPeriodo)
        for (const x of r.partes) if (d3De.has(x.consumo.id)) u.set(x.consumo.id, x.noCubierto);
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
