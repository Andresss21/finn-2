// Gasto semanal por categoría (04 §6.9.3, P4-10, BE-40 [Propio]). Semanas sₖ del período desde su
// inicio, de 7 días (la última de 1 a 7). Referencia = parte proporcional de lo asignado con redondeo
// ACUMULADO: RefAcum(k) = redondeo mitad arriba de Asig × días acumulados / dur, Ref(k) = RefAcum(k) −
// RefAcum(k − 1), así la suma de las semanas es exactamente Asig (V-22). Con Asig < 0 es 0 (R3).
import { asignado } from '../../calculo/d2';
import { duracion, type Periodo, periodoDe } from '../../calculo/periodos';
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { medidor, puntosBasicos, type Rango } from './comunes';
import { existiaEn } from './existia-en';

export interface ParametrosGastoSemanal {
  /** Por defecto, el período activo. */
  readonly periodoInicio?: FechaLocal;
  readonly categoriaIds?: readonly Uuid[];
}

export interface SemanaDelPeriodo extends Rango {
  readonly k: number;
  readonly dias: number;
}

/** Las semanas de un período: ⌈dur / 7⌉, la última con el resto. */
export function semanasDe(p: Rango): SemanaDelPeriodo[] {
  const dur = FechaLocal.diasEntre(p.inicio, p.fin) + 1;
  return Array.from({ length: Math.ceil(dur / 7) }, (_, n) => {
    const desde = FechaLocal.sumarDias(p.inicio, 7 * n);
    const hasta = FechaLocal.sumarDias(p.inicio, Math.min(7 * (n + 1), dur) - 1);
    return { k: n + 1, inicio: desde, fin: hasta, dias: FechaLocal.diasEntre(desde, hasta) + 1 };
  });
}

/** RefAcum(k) para k = 1 … ⌈dur / 7⌉; todo en cero si lo asignado es negativo. */
export function referenciasAcumuladas(asig: Centavos, dur: number): Centavos[] {
  const n = Math.ceil(dur / 7);
  return Array.from({ length: n }, (_, n0) =>
    asig < 0
      ? Centavos.cero
      : Centavos.proporcionMitadArriba(asig, Math.min(7 * (n0 + 1), dur), dur),
  );
}

/** Ref(k) de cada semana: las diferencias de la referencia acumulada. Suman Asig si Asig ≥ 0. */
export function referenciasSemanales(asig: Centavos, dur: number): Centavos[] {
  const acum = referenciasAcumuladas(asig, dur);
  return acum.map((x, k) => Centavos.restar(x, acum[k - 1] ?? Centavos.cero));
}

export interface SemanaDeGasto {
  readonly k: number;
  readonly desde: FechaLocal;
  readonly hasta: FechaLocal;
  readonly dias: number;
  readonly futura: boolean;
  readonly gasto: Centavos;
  readonly referencia: Centavos;
  readonly gastoAcumulado: Centavos;
  readonly referenciaAcumulada: Centavos;
  /** El gasto de la misma semana en los hasta 3 períodos cerrados anteriores en que existía c. */
  readonly anteriores: readonly { readonly periodo: FechaLocal; readonly gasto: Centavos }[];
}

export interface GastoSemanalDeCategoria {
  readonly categoria: Uuid;
  readonly asignado: Centavos;
  /** Sin períodos anteriores en que existiera: no hay comparación ("Categoría nueva"). */
  readonly nueva: boolean;
  readonly semanas: readonly SemanaDeGasto[];
  /** Solo en el período activo (CF-25): `null` si Ref(k) ≤ 0. */
  readonly semanaActual?: { readonly k: number; readonly porcentajeReferenciaBp: number | null };
  /** RefAcum(k) − gasto acumulado a la semana en curso; solo en el período activo. */
  readonly diferenciaReferencia?: Centavos;
}

export interface GastoSemanal {
  readonly periodo: Periodo;
  readonly categorias: readonly GastoSemanalDeCategoria[];
}

export function gastoSemanal(
  i: Instantanea,
  parametros: ParametrosGastoSemanal = {},
): GastoSemanal {
  const p = periodoDe(i.ciclo, parametros.periodoInicio ?? i.presupuesto.activo.inicio);
  const dur = duracion(p);
  const m = medidor(i);
  const previos = i.presupuesto.periodos.filter((q) => q.fin < p.inicio && q.fin < i.hoy).reverse();
  const elegidas = m.normales
    .filter((c) =>
      parametros.categoriaIds === undefined
        ? existiaEn(i, c.id, p)
        : parametros.categoriaIds.includes(c.id),
    )
    .sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
  const esActivo = p.inicio <= i.hoy && i.hoy <= p.fin;

  const categorias = elegidas.map((c): GastoSemanalDeCategoria => {
    const asig = asignado(i.hechos.asignaciones, c.id, p);
    const acum = referenciasAcumuladas(asig, dur);
    const comparables = previos.filter((q) => existiaEn(i, c.id, q)).slice(0, 3);
    let gastoAcumulado = Centavos.cero;
    const semanas = semanasDe(p).map((s): SemanaDeGasto => {
      const futura = s.inicio > i.hoy;
      const gasto = futura ? Centavos.cero : m.gastado(c.id, s);
      gastoAcumulado = Centavos.sumar(gastoAcumulado, gasto);
      const referenciaAcumulada = acum[s.k - 1] ?? Centavos.cero;
      return {
        k: s.k,
        desde: s.inicio,
        hasta: s.fin,
        dias: s.dias,
        futura,
        gasto,
        referencia: Centavos.restar(referenciaAcumulada, acum[s.k - 2] ?? Centavos.cero),
        gastoAcumulado,
        referenciaAcumulada,
        anteriores: comparables.flatMap((q) => {
          const sq = semanasDe(q)[s.k - 1];
          return sq === undefined ? [] : [{ periodo: q.inicio, gasto: m.gastado(c.id, sq) }];
        }),
      };
    });
    const actual = esActivo ? semanas.find((s) => s.desde <= i.hoy && i.hoy <= s.hasta) : undefined;
    return {
      categoria: c.id,
      asignado: asig,
      nueva: comparables.length === 0,
      semanas,
      ...(actual === undefined
        ? {}
        : {
            semanaActual: {
              k: actual.k,
              porcentajeReferenciaBp:
                actual.referencia > 0 ? puntosBasicos(actual.gasto, actual.referencia) : null,
            },
            diferenciaReferencia: Centavos.restar(
              actual.referenciaAcumulada,
              actual.gastoAcumulado,
            ),
          }),
    };
  });
  return { periodo: p, categorias };
}
