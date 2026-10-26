// Ritmo de gasto y proyección del cierre (06 §3.5.4 y §3.5.5, FD-10, FD-11, CF-04, CF-06). Dos
// capas: `ritmoDeCategoria`, `repartir` y `proyeccionDelCierre` son aritmética pura sobre números
// (la que prueba V6-02); `ritmo` toma esas entradas de la instantánea. Los textos y las propuestas
// las arma la aplicación (04 §7.10): el hallazgo trae la acción como datos.
import { pendientes } from '../../calculo/ocurrencias';
import { pagoExcedente } from '../../calculo/sobregiros';
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { nombres, type PeriodoDto, periodoDto, type Ref } from '../comunes';
import { contexto, dentro, suma } from './comunes';
import { CONSUMOS_MIN_RITMO, DIAS_MIN_RITMO, EXCESO_MIN, EXCESO_MIN_PCT } from './umbrales';

/** Medio de pago: `'debito'` (débito o efectivo) o el id de la tarjeta. */
export type Medio = string;
export const DEBITO: Medio = 'debito';

interface PorMedio {
  readonly monto: Centavos;
  readonly medio: Medio;
}

export interface EntradaDeRitmo {
  readonly disponible: Centavos;
  /** F(c, A) = Arr + Asig + Ent. */
  readonly fondo: Centavos;
  /** Consumos variables (netos) de c en A. */
  readonly variables: readonly PorMedio[];
  /** Programadas pendientes de c hasta fin(A), con el medio de su cuenta. */
  readonly pendientes: readonly PorMedio[];
  readonly diasTranscurridos: number;
  readonly diasRestantes: number;
}

export interface ResultadoDeRitmo {
  readonly evaluable: boolean;
  readonly gastoVariable: Centavos;
  readonly proyeccionVariable: Centavos;
  readonly programadasPendientes: Centavos;
  readonly disponibleProyectado: Centavos;
  readonly exceso: Centavos;
  /** proyVar repartido por medio, más cada programada con su medio. */
  readonly futuro: ReadonlyMap<Medio, Centavos>;
  /** Hay hallazgo (3.5.4 paso 5). */
  readonly hallazgo: boolean;
}

const uno = Centavos.desdeEntero(1);
const positivo = (x: Centavos) => Centavos.max(Centavos.cero, x);
const total = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
/** Orden de desempate de FD-19: `debito` antes que las tarjetas, estas por id. */
const porMedio = (a: Medio, b: Medio) =>
  a === b ? 0 : a === DEBITO ? -1 : b === DEBITO ? 1 : a < b ? -1 : 1;

/**
 * Reparto por resto mayor (FD-19): cada parte es la proporcional truncada y los centavos que faltan
 * van a los restos mayores (empate: `debito` y después el id). La parte truncada sale de la
 * proporción de `Centavos` (mitad arriba) corregida con una comparación en `bigint`: no se divide.
 */
export function repartir(
  monto: Centavos,
  pesos: ReadonlyMap<Medio, Centavos>,
): Map<Medio, Centavos> {
  const base = total([...pesos.values()]);
  const salida = new Map<Medio, Centavos>();
  if (monto === 0 || base === 0) return salida;
  const filas = [...pesos].map(([medio, peso]) => {
    const exacto = BigInt(monto) * BigInt(peso);
    const redondeada = Centavos.proporcionMitadArriba(monto, peso, base);
    const parte =
      BigInt(redondeada) * BigInt(base) > exacto ? Centavos.restar(redondeada, uno) : redondeada;
    return { medio, parte, resto: exacto - BigInt(parte) * BigInt(base) };
  });
  const faltan = Centavos.restar(monto, total(filas.map((x) => x.parte)));
  const orden = [...filas].sort((a, b) =>
    a.resto === b.resto ? porMedio(a.medio, b.medio) : a.resto > b.resto ? -1 : 1,
  );
  const extra = new Set(orden.slice(0, faltan).map((x) => x.medio));
  for (const x of filas) {
    const v = extra.has(x.medio) ? Centavos.sumar(x.parte, uno) : x.parte;
    if (v > 0) salida.set(x.medio, v);
  }
  return salida;
}

const sumarPorMedio = (xs: readonly PorMedio[]): Map<Medio, Centavos> => {
  const m = new Map<Medio, Centavos>();
  for (const x of xs) m.set(x.medio, Centavos.sumar(m.get(x.medio) ?? Centavos.cero, x.monto));
  return m;
};

/** 3.5.4, pasos 1 a 5, para una categoría. */
export function ritmoDeCategoria(e: EntradaDeRitmo): ResultadoDeRitmo {
  const gastoVariable = positivo(total(e.variables.map((x) => x.monto)));
  const evaluable =
    e.diasTranscurridos >= DIAS_MIN_RITMO && e.variables.length >= CONSUMOS_MIN_RITMO;
  const proyeccionVariable = evaluable
    ? Centavos.proporcionMitadArriba(gastoVariable, e.diasRestantes, e.diasTranscurridos)
    : Centavos.cero;
  const programadasPendientes = total(e.pendientes.map((x) => x.monto));
  const disponibleProyectado = Centavos.restar(
    Centavos.restar(e.disponible, proyeccionVariable),
    programadasPendientes,
  );
  const exceso = positivo(Centavos.negar(disponibleProyectado));
  const pesos = new Map(
    [...sumarPorMedio(e.variables)].map(([medio, monto]) => [medio, positivo(monto)] as const),
  );
  const futuro = repartir(proyeccionVariable, pesos);
  for (const p of e.pendientes)
    futuro.set(p.medio, Centavos.sumar(futuro.get(p.medio) ?? Centavos.cero, p.monto));
  const umbral = Centavos.max(
    EXCESO_MIN,
    Centavos.proporcionMitadArriba(positivo(e.fondo), EXCESO_MIN_PCT[0], EXCESO_MIN_PCT[1]),
  );
  return {
    evaluable,
    gastoVariable,
    proyeccionVariable,
    programadasPendientes,
    disponibleProyectado,
    exceso,
    futuro,
    hallazgo: evaluable && exceso > 0 && exceso >= umbral,
  };
}

export interface CierreDeCategoria {
  readonly disponibleProyectado: Centavos;
  /** SobD actual. */
  readonly sobregiroDebito: Centavos;
  /** El sobregiro adicional proyectado, repartido entre débito y tarjetas. */
  readonly adicional: ReadonlyMap<Medio, Centavos>;
}

export interface ProyeccionDelCierre {
  readonly sobregiradas: number;
  readonly reduccionLpa: Centavos;
  readonly sobrante: Centavos;
  /** S(t) + Σ partes de t del adicional. */
  readonly faltaReservar: ReadonlyMap<Medio, Centavos>;
}

/** 3.5.5: totales del período a partir de cada categoría, de S(t) y de los E(t) actuales. */
export function proyeccionDelCierre(
  categorias: readonly CierreDeCategoria[],
  sinReservar: ReadonlyMap<Medio, Centavos>,
  excedentes: readonly Centavos[],
): ProyeccionDelCierre {
  const falta = new Map(sinReservar);
  let sobregiradas = 0;
  let sobrante = Centavos.cero;
  let debito = Centavos.cero;
  for (const c of categorias) {
    const nuevoDebito = c.adicional.get(DEBITO) ?? Centavos.cero;
    debito = Centavos.sumar(debito, Centavos.sumar(c.sobregiroDebito, nuevoDebito));
    for (const [t, v] of c.adicional)
      if (t !== DEBITO) falta.set(t, Centavos.sumar(falta.get(t) ?? Centavos.cero, v));
    if (c.disponibleProyectado < 0) sobregiradas += 1;
    else sobrante = Centavos.sumar(sobrante, c.disponibleProyectado);
  }
  return {
    sobregiradas,
    reduccionLpa: excedentes.reduce(Centavos.sumar, debito),
    sobrante,
    faltaReservar: falta,
  };
}

export type AccionDeRitmo =
  | { readonly tipo: 'mover'; readonly origen: Ref; readonly monto: Centavos }
  | { readonly tipo: 'asignar'; readonly montoNuevo: Centavos }
  | { readonly tipo: 'revisar'; readonly categoriaId: Uuid };

/** Hallazgo de ritmo sin texto ni propuesta: los arma la aplicación (04 §7.10). */
export interface HallazgoDeRitmo {
  readonly tipo: 'ritmo';
  readonly clave: string;
  /** Para ordenar: el exceso proyectado. */
  readonly impacto: Centavos;
  readonly estado: 'problema' | 'deuda-sin-respaldo';
  readonly categoria: Ref;
  readonly exceso: Centavos;
  /** El sobregiro de hoy; 0 elige el texto "Vas camino a pasarte". */
  readonly sobregiroActual: Centavos;
  readonly fin: FechaLocal;
  readonly accion: AccionDeRitmo;
}

export interface CategoriaDeRitmo extends ResultadoDeRitmo {
  readonly categoria: Ref;
  readonly grupo: Ref;
  readonly disponible: Centavos;
}

export interface RitmoSel {
  readonly periodo: PeriodoDto;
  readonly proyeccion: {
    readonly sobregiradas: number;
    readonly reduccionLpa: Centavos;
    readonly sobrante: Centavos;
    readonly faltaReservar: { tarjeta: Ref; actual: Centavos; proyectado: Centavos }[];
  };
  readonly categorias: readonly CategoriaDeRitmo[];
  /** Por impacto descendente; a igual impacto, por grupo y categoría. */
  readonly hallazgos: readonly HallazgoDeRitmo[];
}

/** El reporte `ritmo` sobre el período activo. */
export function ritmo(i: Instantanea): RitmoSel {
  const h = i.hechos;
  const a = i.presupuesto.activo;
  const nom = nombres(i);
  const dt = FechaLocal.diasEntre(a.inicio, i.hoy) + 1;
  const dr = FechaLocal.diasEntre(i.hoy, a.fin);
  const resueltas = new Set(
    h.ocurrencias_resueltas.flatMap((r) =>
      r.transaccionId !== null && r.estado !== 'omitida' ? [r.transaccionId] : [],
    ),
  );
  const txDeLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const tarjetas = new Set(h.tarjetas.map((t) => t.cuentaId));
  const medioDe = (cuentaId: Uuid): Medio => (tarjetas.has(cuentaId) ? cuentaId : DEBITO);
  const grupos = new Map(h.grupos.map((g) => [g.id, g]));
  const consumosA = contexto(i).consumos.filter((x) => dentro(a, x.fecha));
  const faltantes = pendientes(h, i.hoy, dr);
  const celdas = i.presupuesto.celdas.filter((x) => x.periodo.inicio === a.inicio);

  const filas = h.categorias
    .filter((c) => c.clase === 'normal' && !c.archivada)
    .sort(
      (x, y) =>
        (grupos.get(x.grupoId)?.orden ?? 0) - (grupos.get(y.grupoId)?.orden ?? 0) ||
        x.orden - y.orden,
    )
    .flatMap((c) => {
      const celda = celdas.find((x) => x.categoriaId === c.id);
      const grupo = grupos.get(c.grupoId);
      if (celda === undefined || grupo === undefined) return [];
      const propios = consumosA.filter((x) => x.categoriaId === c.id);
      const variables = propios.flatMap((x) => {
        const tx = x.fuente === 'linea' ? txDeLinea.get(x.id) : undefined;
        return tx !== undefined && resueltas.has(tx)
          ? []
          : [{ monto: x.neto, medio: x.tarjetaId ?? DEBITO }];
      });
      const deProgramadas = faltantes.flatMap((o) => {
        const p = h.programadas.find((x) => x.id === o.programadaId);
        return p?.tipo !== 'gasto'
          ? []
          : h.programada_lineas
              .filter((l) => l.programadaId === p.id && l.categoriaId === c.id)
              .map((l) => ({ monto: l.monto, medio: medioDe(p.cuentaId) }));
      });
      const r = ritmoDeCategoria({
        disponible: celda.disponible,
        fondo: Centavos.sumar(celda.disponible, suma(propios.map((x) => x.neto))),
        variables,
        pendientes: deProgramadas,
        diasTranscurridos: dt,
        diasRestantes: dr,
      });
      const actual = Centavos.sumar(celda.sobT, celda.sobD);
      const adicional = repartir(positivo(Centavos.restar(r.exceso, actual)), r.futuro);
      return [{ c, celda, grupo, r, adicional, actual }];
    });

  const sinReservar = new Map(
    i.tarjetas.filter((t) => t.sinRespaldo > 0).map((t) => [t.tarjetaId as Medio, t.sinRespaldo]),
  );
  const cierre = proyeccionDelCierre(
    filas.map((x) => ({
      disponibleProyectado: x.r.disponibleProyectado,
      sobregiroDebito: x.celda.sobD,
      adicional: x.adicional,
    })),
    sinReservar,
    celdas.map(pagoExcedente),
  );

  const metaDeAhorro = new Set(
    h.metas.filter((m) => m.tipo === 'anual' || m.tipo === 'para_fecha').map((m) => m.categoriaId),
  );
  const conFalta = new Set(
    i.metas.filter((m) => (m.evaluacion?.falta ?? 0) > 0).map((m) => m.categoriaId),
  );
  const hallazgos = filas
    .filter((x) => x.r.hallazgo)
    .map((x): HallazgoDeRitmo => {
      const deDebito = Centavos.sumar(x.celda.sobD, x.adicional.get(DEBITO) ?? Centavos.cero);
      const origen = filas.find(
        (o) =>
          o.c.id !== x.c.id &&
          o.r.disponibleProyectado >= x.r.exceso &&
          !metaDeAhorro.has(o.c.id) &&
          !conFalta.has(o.c.id),
      );
      const accion: AccionDeRitmo =
        origen !== undefined
          ? { tipo: 'mover', origen: nom.categoria(origen.c.id), monto: x.r.exceso }
          : i.lpa.total >= x.r.exceso
            ? { tipo: 'asignar', montoNuevo: Centavos.sumar(x.celda.asignado, x.r.exceso) }
            : { tipo: 'revisar', categoriaId: x.c.id };
      return {
        tipo: 'ritmo',
        clave: `categoria:${x.c.id}`,
        impacto: x.r.exceso,
        estado:
          deDebito >= Centavos.restar(x.r.exceso, deDebito) ? 'problema' : 'deuda-sin-respaldo',
        categoria: nom.categoria(x.c.id),
        exceso: x.r.exceso,
        sobregiroActual: x.actual,
        fin: a.fin,
        accion,
      };
    })
    .sort((p, q) => q.impacto - p.impacto);

  return {
    periodo: periodoDto(i, a),
    proyeccion: {
      sobregiradas: cierre.sobregiradas,
      reduccionLpa: cierre.reduccionLpa,
      sobrante: cierre.sobrante,
      faltaReservar: [...cierre.faltaReservar].map(([t, proyectado]) => ({
        tarjeta: nom.cuenta(t as Uuid),
        actual: sinReservar.get(t) ?? Centavos.cero,
        proyectado,
      })),
    },
    categorias: filas.map((x) => ({
      ...x.r,
      categoria: nom.categoria(x.c.id),
      grupo: nom.grupo(x.grupo.id),
      disponible: x.celda.disponible,
    })),
    hallazgos,
  };
}
