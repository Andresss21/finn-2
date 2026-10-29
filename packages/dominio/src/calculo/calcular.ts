// `calcular(hechos, hoy)` (04 §2.4, BE-09; 02 §2.3): la instantánea inmutable con todos los
// derivados de 01 §3, en el orden de §4.1. Es la única entrada pública al cálculo: arma los
// derivados con las fórmulas de los demás módulos de calculo/, que no se exportan (inv. 27).
// Nada se guarda (regla de cierre de §3): la instantánea vive solo en memoria.
//
// Determinismo (inv. 26): cada tabla se ordena por su id antes de calcular, así que el orden de
// inserción de los hechos no cambia ni los números ni el orden de las listas. El orden cronológico
// sale de (fecha, clave de orden), que son hechos (§4.1 conv. 2).
//
// Fuera de la instantánea quedan los derivados que dependen de un parámetro de la consulta y no
// solo de los hechos y de hoy: fechas de corte y ciclo de facturación de una tarjeta (§4.14, por
// mes), uso del límite (proyección de 04 §6), tabla de amortización (Anexo A) y avisos de estado
// (TA-110). Los calculan los selectores con las mismas fórmulas.
import type { Cuenta, Hechos, Instantanea, TablaMotor, Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { type Clasificacion, clasificacion } from './clasificacion';
import { mediosDe, movimientos, porId } from './devoluciones';
import { agrupar, type Presupuesto, presupuesto } from './disponible';
import { type DetalleLpa, entradasDeEfectos, historialLpa, listoParaAsignar } from './lpa';
import { type EvaluacionDeMeta, evaluarMeta } from './metas';
import { type OcurrenciaPendiente, pendientes } from './ocurrencias';
import { type PatrimonioNeto, patrimonioNeto } from './patrimonio';
import { type Ciclo, ciclo, type Periodo } from './periodos';
import { pagosImplicitos, type PorCobrar, porCobrar } from './por-cobrar';
import { saldo, saldoYConfirmado } from './saldos';
import { reduccionProyectada, sobregiroConTarjetaDelActivo } from './sobregiros';
import { type EstadoDeTarjeta, estadoDeTarjeta } from './tarjetas';

/** Horizonte de las ocurrencias pendientes: el mayor de BE-37 (30 días en Programadas). */
const HORIZONTE_OCURRENCIAS = 30;

/**
 * Períodos futuros proyectados después del último con datos (§4.6; 04 §6.2, "Disp proyectado con
 * actividad cero"). Uno basta: desde el primero sin hechos ni asignaciones, Disp ≥ 0 y cada período
 * siguiente repite sus números, así que más períodos no agregan información [Propio, TA-235].
 */
const PERIODOS_PROYECTADOS = 1;

/** Saldo de cuenta y saldo confirmado (§4.3). Deuda, capital y valor salen de `saldo` por tipo. */
export interface SaldoDeCuenta {
  readonly cuentaId: Uuid;
  readonly tipo: Cuenta['tipo'];
  readonly saldo: Centavos;
  readonly confirmado: Centavos;
}

/** LPA al cierre de un período cerrado (§4.9, error 12). */
export interface LpaDePeriodo {
  readonly periodo: Periodo;
  readonly lpa: Centavos;
}

/** Una meta evaluada en el período activo (§4.12); `null` si su categoría está archivada. */
export interface MetaEvaluada {
  readonly metaId: Uuid;
  readonly categoriaId: Uuid;
  readonly evaluacion: EvaluacionDeMeta | null;
}

/** Los derivados de 01 §3 que dependen solo de los hechos y de hoy. */
export interface Derivados {
  readonly ciclo: Ciclo;
  readonly cuentas: readonly SaldoDeCuenta[];
  readonly porCobrar: readonly PorCobrar[];
  /** Períodos, D2, Disp, Arr, sobregiros por celda, aportes y pagos implícitos (§4.2 a §4.7). */
  readonly presupuesto: Presupuesto;
  /** SobTA: sobregiro con tarjeta del período abierto (§4.7). */
  readonly sobregiroConTarjeta: Centavos;
  /** Reducción de LPA proyectada al cierre del activo (§4.7). */
  readonly reduccionProyectada: Centavos;
  /** S(t), RE(t) y "te falta reservar" por tarjeta (§4.8). */
  readonly tarjetas: readonly EstadoDeTarjeta[];
  readonly lpa: DetalleLpa;
  readonly historialLpa: readonly LpaDePeriodo[];
  readonly metas: readonly MetaEvaluada[];
  readonly clasificacion: Clasificacion;
  readonly patrimonio: PatrimonioNeto;
  readonly ocurrencias: readonly OcurrenciaPendiente[];
}

/** El id de una fila; los subtipos de cuenta (tarjeta, préstamo, inversión) se identifican por su cuenta. */
const clave = (x: object): string =>
  'id' in x ? String(x.id) : String((x as { readonly cuentaId: Uuid }).cuentaId);

/** Tablas y filas ordenadas por nombre e id: la forma canónica de unos hechos (inv. 26). */
function canonicos(h: Hechos): Hechos {
  // La clave de cada fila se calcula una vez, no en cada comparación. Si ya están en orden (los
  // hechos de una instantánea anterior), el orden estable las deja igual: basta copiarlas.
  const ordenar = (xs: readonly object[]) => {
    const ks = xs.map(clave);
    let enOrden = true;
    for (let i = 1; enOrden && i < ks.length; i++)
      enOrden = (ks[i - 1] as string) <= (ks[i] as string);
    if (enOrden) return [...xs];
    return xs
      .map((x, i) => [ks[i] as string, x] as const)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, x]) => x);
  };
  const tablas = (Object.keys(h) as TablaMotor[]).sort();
  return Object.fromEntries(tablas.map((t) => [t, ordenar(h[t])])) as unknown as Hechos;
}

/** `Object.freeze` en profundidad. Un `Map` queda congelado como objeto, no en sus entradas. */
function congelar<T>(x: T): T {
  if (typeof x !== 'object' || x === null || Object.isFrozen(x)) return x;
  Object.freeze(x);
  // Como recorrer `Object.values(x)` (las propiedades propias enumerables), sin copiarlas en un
  // arreglo; un valor que no es objeto no se visita.
  if (Array.isArray(x))
    for (let i = 0; i < x.length; i++) {
      const v: unknown = x[i];
      if (typeof v === 'object' && v !== null) congelar(v);
    }
  else
    for (const k in x) {
      const v: unknown = x[k];
      if (typeof v === 'object' && v !== null && Object.hasOwn(x, k)) congelar(v);
    }
  return x;
}

/** La instantánea de `hechos` en `hoy` (04 §2.4). Pura: los mismos hechos y hoy, la misma instantánea. */
export function calcular(hechos: Hechos, hoy: FechaLocal): Instantanea {
  const h = canonicos(hechos);
  // §4.2: períodos; §4.3: saldos.
  const c = ciclo(h.vigencias_ciclo);
  const txs = porId(h.transacciones);
  // saldo(k) con solo los efectos de k y las transacciones por id: lo mismo que saldo(h, k).
  const efectosDe = agrupar(h.efectos, (e) => e.cuentaId);
  const deK = (k: Uuid) => ({ transacciones: [], efectos: efectosDe.get(k) ?? [] });
  // saldo(k) se pide en cuentas, tarjetas y patrimonio: se suma una vez por cuenta y llamada.
  const saldos = new Map<Uuid, Centavos>();
  const saldoDe = (k: Uuid): Centavos => {
    let s = saldos.get(k);
    if (s === undefined) saldos.set(k, (s = saldo(deK(k), k, {}, txs)));
    return s;
  };
  const cuentas = h.cuentas.map((k) => {
    const s = saldoYConfirmado(deK(k.id), k.id, txs);
    if (!saldos.has(k.id)) saldos.set(k.id, s.saldo);
    return { cuentaId: k.id, tipo: k.tipo, saldo: s.saldo, confirmado: s.confirmado };
  });
  // §4.10 antes que §4.6: los pagos implícitos de los cobros entran en Disp(pago(t)).
  // El medio de cada transacción, uno para por cobrar y para los consumos.
  const medios = mediosDe(h);
  const cobros = porCobrar(h, undefined, txs, medios);
  // §4.4 a §4.6 en el orden de §4.1 conv. 4: D2, normales, pago y arrastre, período a período,
  // con la proyección al final.
  // Consumos y devoluciones clasificadas, una vez para §4.4 a §4.6 y para §4.13.
  const m = movimientos(h, c, txs, medios);
  const b = presupuesto(h, c, hoy, pagosImplicitos(cobros), PERIODOS_PROYECTADOS, m);
  const tarjetas = h.cuentas
    .filter((k) => k.tipo === 'tarjeta')
    .map((k) => estadoDeTarjeta(h, b, k.id, saldoDe));
  // Los efectos que son entradas de §4.9, una vez para LPA y su historial.
  const deEfectos = entradasDeEfectos(h, txs);
  const categorias = new Map(h.categorias.map((x) => [x.id, x]));
  const metas = h.metas.map((m) => {
    const x = categorias.get(m.categoriaId);
    if (x === undefined) throw new RangeError(`la meta ${m.id} no tiene categoría (inv. 25)`);
    return { metaId: m.id, categoriaId: m.categoriaId, evaluacion: evaluarMeta(m, x, b, c, hoy) };
  });
  return congelar({
    hechos: h,
    hoy,
    ciclo: c,
    cuentas,
    porCobrar: cobros,
    presupuesto: b,
    sobregiroConTarjeta: sobregiroConTarjetaDelActivo(b),
    reduccionProyectada: reduccionProyectada(b),
    tarjetas,
    lpa: listoParaAsignar(h, b, cobros, txs, deEfectos),
    historialLpa: historialLpa(h, b, cobros, txs, deEfectos),
    metas,
    clasificacion: clasificacion(h, c, cobros, m, txs),
    patrimonio: patrimonioNeto(h, cobros, saldoDe),
    ocurrencias: pendientes(h, hoy, HORIZONTE_OCURRENCIAS),
  });
}
