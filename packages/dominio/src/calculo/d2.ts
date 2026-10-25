// Respaldo y reparto D2 (01 §4.5, pasos 1 a 7; §4.1 conv. 2, 4 y 6; inv. 5 y 28; CB-08, CB-21).
// Para una categoría normal c y un período p: fondo, reparto en orden cronológico, traslados por
// tarjeta, SobT y SobD. Arr(c, p) llega de fuera (§4.6, TA-106): los períodos se evalúan del más
// antiguo al más reciente y el reparto de p va antes que su Disponible (§4.1 conv. 4).
import type { Asignacion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { type Aporte, type Consumo, cronologico, type NoCubierta } from './devoluciones';
import type { Periodo } from './periodos';

const en = (p: Periodo, fecha: string) => p.inicio <= fecha && fecha <= p.fin;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/** Lo que el reparto da a un consumo k: cubierto_k + no_cubierto_k = m_k. */
export interface Parte {
  readonly consumo: Consumo;
  readonly cubierto: Centavos;
  readonly noCubierto: Centavos;
}

export interface EntradaD2 {
  readonly categoriaId: Uuid;
  readonly periodo: Periodo;
  /** Consumos de `consumos()` (§4.4), en cualquier orden y de cualquier categoría o período. */
  readonly consumos: readonly Consumo[];
  /** Aportes de `aportes()` (§4.4): dan Ent(c, p). */
  readonly aportes: readonly Aporte[];
  /** Arr(c, p) = máx(0, Disp(c, p − 1)); 0 en el primer período (§4.6). */
  readonly arrastre: Centavos;
  /** Asig(c, p). */
  readonly asignado: Centavos;
}

export interface RepartoD2 {
  readonly categoriaId: Uuid;
  readonly periodo: Periodo;
  /** Ent(c, p) (paso 1). */
  readonly entradas: Centavos;
  /** F(c, p) = Arr + Asig + Ent (paso 2). */
  readonly fondo: Centavos;
  /** Los consumos de c en p en orden D2 con su reparto (pasos 3 y 4). */
  readonly partes: readonly Parte[];
  /** Tr(c, p, t) por tarjeta t, solo las que tienen algo cubierto (paso 5). */
  readonly traslados: ReadonlyMap<Uuid, Centavos>;
  /** Disp(c, p) = F − Σ m_k (propiedad de §4.5: Act = Ent − Σ m_k). */
  readonly disponible: Centavos;
  /** SobT(c, p) = Σ no_cubierto_k con tarjeta (paso 6). */
  readonly sobT: Centavos;
  /** SobD(c, p) = máx(0, −Disp) − SobT (paso 7). */
  readonly sobD: Centavos;
}

/** Ent(c, p) = Σ aportes de devoluciones D-2, D-3 y D-4 a c en p (paso 1). */
export const entradas = (aportes: readonly Aporte[], categoriaId: Uuid, p: Periodo): Centavos =>
  suma(
    aportes.filter((d) => d.categoriaId === categoriaId && en(p, d.fecha)).map((d) => d.aCategoria),
  );

/** Asig(c, p): las asignaciones de c al período p. Una sola por celda (DM-2), pero se suman. */
export const asignado = (
  asignaciones: readonly Pick<Asignacion, 'categoriaId' | 'periodoInicio' | 'monto'>[],
  categoriaId: Uuid,
  p: Periodo,
): Centavos =>
  suma(
    asignaciones
      .filter((a) => a.categoriaId === categoriaId && a.periodoInicio === p.inicio)
      .map((a) => a.monto),
  );

/**
 * Reparto D2 de c en p. El orden es el de `cronologico`, (fecha, clave de orden, secuencia de
 * creación, orden de línea) [CH-14]: dos líneas de una compra van por su orden (CB-08) y dos
 * consumos con la misma fecha y clave, por la secuencia de su transacción (CB-21).
 */
export function repartoD2(e: EntradaD2): RepartoD2 {
  const ent = entradas(e.aportes, e.categoriaId, e.periodo);
  const fondo = Centavos.sumar(Centavos.sumar(e.arrastre, e.asignado), ent);
  const deCp = cronologico(
    e.consumos.filter((k) => k.categoriaId === e.categoriaId && en(e.periodo, k.fecha)),
  );

  let restante = fondo;
  const partes = deCp.map((k): Parte => {
    const cubierto = Centavos.max(Centavos.cero, Centavos.min(k.neto, restante));
    restante = Centavos.restar(restante, cubierto);
    return { consumo: k, cubierto, noCubierto: Centavos.restar(k.neto, cubierto) };
  });

  const traslados = new Map<Uuid, Centavos>();
  let sobT = Centavos.cero;
  for (const x of partes) {
    const t = x.consumo.tarjetaId;
    if (t === null) continue;
    sobT = Centavos.sumar(sobT, x.noCubierto);
    if (x.cubierto > 0)
      traslados.set(t, Centavos.sumar(traslados.get(t) ?? Centavos.cero, x.cubierto));
  }

  const disponible = Centavos.restar(fondo, suma(partes.map((x) => x.consumo.neto)));
  const sobregiro = Centavos.max(Centavos.cero, Centavos.negar(disponible));
  return {
    categoriaId: e.categoriaId,
    periodo: e.periodo,
    entradas: ent,
    fondo,
    partes,
    traslados,
    disponible,
    sobT,
    sobD: Centavos.restar(sobregiro, sobT),
  };
}

/**
 * Σ_c Tr(c, p, t): lo que las categorías normales trasladan a pago(t) en p (§4.4, actividad de
 * pago). Cada traslado resta de c y suma a pago(t) el mismo monto (inv. 5).
 */
export const trasladoA = (repartos: readonly RepartoD2[], tarjetaId: Uuid, p: Periodo): Centavos =>
  suma(
    repartos
      .filter((r) => r.periodo.inicio === p.inicio)
      .map((r) => r.traslados.get(tarjetaId) ?? Centavos.cero),
  );

/**
 * U_L para la D-3 (§4.4): la parte no cubierta del consumo L en su propio período. Una línea sin
 * reparto entre `repartos` da 0. Sin ciclo: m_L ya descuenta las D-1, y una D-3 nunca es del
 * período de L, así que no entra en el fondo de L.
 */
export function noCubiertaDe(repartos: readonly RepartoD2[]): NoCubierta {
  const u = new Map<Uuid, Centavos>();
  for (const r of repartos) for (const x of r.partes) u.set(x.consumo.id, x.noCubierto);
  return (lineaId) => u.get(lineaId) ?? Centavos.cero;
}
