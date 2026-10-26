// Suscripciones detectadas (06 §3.5.9, FD-15 [R1], CF-04): cobros mensuales repetidos, por clave de
// comercio (BE-43), sobre los 4 últimos períodos cerrados. La propuesta (programar, reactivar o abrir
// el flujo) va como datos; el texto lo arma la aplicación (04 §7.10). Las reglas de comercio son [H].
import type { Frecuencia, Instantanea, Programada, ReglaComercio, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { nombres, type Ref } from '../comunes';
import {
  claveDeComercio,
  masFrecuente,
  menorPrimero,
  patronesOrdenados,
  SIN_COMERCIO,
} from './agrupacion';
import { contexto, dentro } from './comunes';
import { SUSC_DIAS, SUSC_MONTO_PCT, SUSC_PERIODOS, SUSC_PERIODOS_MIN } from './umbrales';

export interface ValoresDeProgramada {
  readonly cuentaId: Uuid;
  readonly comercio: string;
  readonly monto: Centavos;
  /** La mayor diferencia observada respecto de la mediana en los períodos con cobro. */
  readonly tolerancia: Centavos;
  readonly frecuencia: 'mensual';
  /** La siguiente fecha esperada. */
  readonly primeraFecha: FechaLocal;
  readonly categoriaId: Uuid | null;
  readonly registroAutomatico: false;
}

export type AccionDeSuscripcion =
  | { readonly tipo: 'reactivar'; readonly programadaId: Uuid }
  | { readonly tipo: 'programar'; readonly valores: ValoresDeProgramada }
  /** La categoría de la última transacción no está activa: el flujo se abre con estos valores. */
  | { readonly tipo: 'abrir_flujo'; readonly valores: ValoresDeProgramada };

export interface Detectada {
  readonly clave: string;
  readonly etiqueta: string;
  readonly mensual: Centavos;
  readonly anual: Centavos;
  readonly dia: number;
  readonly periodosConCobro: number;
  readonly cuenta: Ref;
  readonly categoria: Ref | null;
  readonly programadaDesactivada?: Ref;
}

export interface YaProgramada {
  readonly programada: Ref;
  readonly comercio: string;
  readonly mensual: Centavos;
  readonly anual: Centavos;
  readonly frecuencia: Frecuencia;
}

export interface HallazgoDeSuscripcion {
  readonly tipo: 'suscripcion';
  readonly clave: string;
  /** El costo mensual. */
  readonly impacto: Centavos;
  readonly estado: 'advertencia';
  readonly comercio: string;
  readonly mensual: Centavos;
  readonly anual: Centavos;
  readonly desactivada: boolean;
  readonly accion: AccionDeSuscripcion;
}

export interface SuscripcionesSel {
  /** Hay al menos 4 períodos cerrados; si no, no se detecta nada. */
  readonly suficiente: boolean;
  readonly detectadas: readonly Detectada[];
  readonly programadas: readonly YaProgramada[];
  /** Por costo mensual descendente; después por clave. */
  readonly hallazgos: readonly HallazgoDeSuscripcion[];
}

/** Mediana baja: con un número par de valores, el menor de los dos centrales. */
const medianaBaja = <T extends number>(xs: readonly T[]): T =>
  [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)] as T;

const abs = (x: number) => (x < 0 ? -x : x);

/** Mensual y anual de una programada, convertidos con el redondeo de 3.5.3. */
function costoDe(p: Programada): { mensual: Centavos; anual: Centavos } {
  const prop = Centavos.proporcionMitadArriba;
  const por = (veces: number) => Centavos.desdeEntero(p.monto * veces);
  switch (p.frecuencia) {
    case 'semanal':
      return { mensual: prop(p.monto, 52, 12), anual: por(52) };
    case 'quincenal':
      return { mensual: prop(p.monto, 26, 12), anual: por(26) };
    case 'mensual':
      return { mensual: p.monto, anual: por(12) };
    case 'anual':
      return { mensual: prop(p.monto, 1, 12), anual: p.monto };
    case 'cada_n_dias': {
      const n = p.frecuenciaDias ?? 1;
      return { mensual: prop(p.monto, 365, n * 12), anual: prop(p.monto, 365, n) };
    }
  }
}

export function suscripciones(
  i: Instantanea,
  reglas: readonly Pick<ReglaComercio, 'patron'>[],
): SuscripcionesSel {
  const h = i.hechos;
  const nom = nombres(i);
  const cx = contexto(i);
  const patrones = patronesOrdenados(reglas);
  const periodos = i.presupuesto.periodos.filter((p) => p.fin < i.hoy).slice(-SUSC_PERIODOS);
  const gastosProgramados = h.programadas.filter((p) => p.tipo === 'gasto');

  const programadas = gastosProgramados
    .filter((p) => p.activa)
    .map((p): YaProgramada => {
      const costo = costoDe(p);
      return {
        programada: { id: p.id, nombre: p.comercio },
        comercio: p.comercio,
        ...costo,
        frecuencia: p.frecuencia,
      };
    })
    .sort((a, b) => b.mensual - a.mensual || menorPrimero(a.programada.id, b.programada.id));

  if (periodos.length < SUSC_PERIODOS)
    return { suficiente: false, detectadas: [], programadas, hallazgos: [] };

  const porClave = new Map<string, typeof h.transacciones>();
  for (const t of h.transacciones) {
    if (t.tipo !== 'gasto' || !periodos.some((p) => dentro(p, t.fecha))) continue;
    const { clave } = claveDeComercio(patrones, t.comercio);
    porClave.set(clave, [...(porClave.get(clave) ?? []), t]);
  }

  const claveActiva = new Set(
    gastosProgramados
      .filter((p) => p.activa)
      .map((p) => claveDeComercio(patrones, p.comercio).clave),
  );
  const ultimaResolucion = (p: Programada): FechaLocal | null =>
    h.ocurrencias_resueltas
      .filter((r) => r.programadaId === p.id && r.estado !== 'omitida')
      .map((r) => r.fechaEsperada)
      .sort()
      .at(-1) ?? null;
  const desactivadaDe = (clave: string): Programada | undefined =>
    gastosProgramados
      .filter((p) => !p.activa && claveDeComercio(patrones, p.comercio).clave === clave)
      .map((p) => ({ p, resolucion: ultimaResolucion(p) }))
      .sort(
        (x, y) =>
          Number(y.resolucion !== null) - Number(x.resolucion !== null) ||
          menorPrimero(y.resolucion ?? y.p.primeraFecha, x.resolucion ?? x.p.primeraFecha) ||
          menorPrimero(x.p.id, y.p.id),
      )[0]?.p;

  const detectadas: Detectada[] = [];
  const hallazgos: HallazgoDeSuscripcion[] = [];
  for (const [clave, txs] of porClave) {
    const mediana = medianaBaja(txs.map((t) => t.total));
    const dia = medianaBaja(txs.map((t) => FechaLocal.partes(t.fecha).dia));
    const cobros = txs.filter(
      (t) =>
        abs(t.total - mediana) * SUSC_MONTO_PCT[1] <= mediana * SUSC_MONTO_PCT[0] &&
        abs(FechaLocal.partes(t.fecha).dia - dia) <= SUSC_DIAS,
    );
    const conCobro = periodos.filter((p) => cobros.some((t) => dentro(p, t.fecha))).length;
    if (conCobro < SUSC_PERIODOS_MIN || claveActiva.has(clave)) continue;

    const ultima = [...txs].sort(
      (x, y) => menorPrimero(y.fecha, x.fecha) || menorPrimero(y.claveOrden, x.claveOrden),
    )[0];
    if (ultima === undefined) continue;
    const etiqueta = claveDeComercio(patrones, ultima.comercio).porRegla
      ? claveDeComercio(patrones, ultima.comercio).etiqueta
      : masFrecuente(
          txs.reduce((m, t) => {
            const e = claveDeComercio(patrones, t.comercio).escrito;
            return m.set(e, (m.get(e) ?? 0) + 1);
          }, new Map<string, number>()),
        ) || SIN_COMERCIO;
    const cuentaId = [...cx.cuentasDe(ultima.id)].sort()[0] as Uuid;
    const categoriaId =
      h.lineas
        .filter((l) => l.transaccionId === ultima.id && l.categoriaId !== null)
        .sort((x, y) => x.orden - y.orden)[0]?.categoriaId ?? null;
    const categoria = categoriaId === null ? null : nom.categoria(categoriaId);
    const mensual = mediana;
    const anual = Centavos.desdeEntero(mediana * 12);
    const desactivada = desactivadaDe(clave);
    const hoyDelMes = FechaLocal.inicioDeMes(i.hoy, dia);
    const valores: ValoresDeProgramada = {
      cuentaId,
      comercio: etiqueta,
      monto: mensual,
      tolerancia: Centavos.desdeEntero(Math.max(0, ...cobros.map((t) => abs(t.total - mediana)))),
      frecuencia: 'mensual',
      primeraFecha:
        hoyDelMes > i.hoy
          ? hoyDelMes
          : FechaLocal.inicioDeMes(FechaLocal.sumarMeses(FechaLocal.inicioDeMes(i.hoy, 1), 1), dia),
      categoriaId,
      registroAutomatico: false,
    };
    detectadas.push({
      clave,
      etiqueta,
      mensual,
      anual,
      dia,
      periodosConCobro: conCobro,
      cuenta: nom.cuenta(cuentaId),
      categoria,
      ...(desactivada === undefined
        ? {}
        : { programadaDesactivada: { id: desactivada.id, nombre: desactivada.comercio } }),
    });
    hallazgos.push({
      tipo: 'suscripcion',
      clave: `comercio:${clave}`,
      impacto: mensual,
      estado: 'advertencia',
      comercio: etiqueta,
      mensual,
      anual,
      desactivada: desactivada !== undefined,
      accion:
        desactivada !== undefined
          ? { tipo: 'reactivar', programadaId: desactivada.id }
          : categoria !== null && categoria.archivada !== true
            ? { tipo: 'programar', valores }
            : { tipo: 'abrir_flujo', valores },
    });
  }

  detectadas.sort((a, b) => b.mensual - a.mensual || menorPrimero(a.clave, b.clave));
  hallazgos.sort((a, b) => b.impacto - a.impacto || menorPrimero(a.clave, b.clave));
  return { suficiente: true, detectadas, programadas, hallazgos };
}
