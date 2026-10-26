// Presupuesto contra la realidad y comparación con el promedio (06 §3.5.6 y §3.5.7, FD-12, FD-13,
// CF-04). Dos hallazgos por datos: el texto y la propuesta los arma la aplicación (04 §7.10). Las
// divisiones son de `Centavos` (CH-17). Las categorías archivadas no generan hallazgos (3.5.3).
import { asignado } from '../../calculo/d2';
import type { Periodo } from '../../calculo/periodos';
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import type { Ref } from '../comunes';
import { nombres, type PeriodoDto, periodoDto } from '../comunes';
import { medidor, puntosBasicos, suma } from './comunes';
import { existiaEn } from './existia-en';
import { ritmo } from './ritmo';
import { PROM_VAR_MIN, PROM_VAR_PCT, REAL_TOL_MIN, REAL_TOL_PCT } from './umbrales';

/** Períodos de comparación que exigen 3.5.6 y 3.5.7 (FD-29). */
const PERIODOS_DE_COMPARACION = 3;

export type AccionDeRealidad =
  | { readonly tipo: 'asignar'; readonly montoNuevo: Centavos }
  | { readonly tipo: 'meta'; readonly metaId: Uuid; readonly monto: Centavos };

export interface HallazgoDeRealidad {
  readonly tipo: 'realidad';
  readonly clave: string;
  /** |Sugerido − Asig(c, A)|. */
  readonly impacto: Centavos;
  readonly estado: 'advertencia';
  readonly categoria: Ref;
  /** `pasas`: siempre gastás más de lo asignado; `sobra`: siempre te sobra. */
  readonly causa: 'pasas' | 'sobra';
  readonly promedioGastado: Centavos;
  readonly asignadoPromedio: Centavos;
  readonly sugerido: Centavos;
  readonly accion: AccionDeRealidad;
}

export interface HallazgoDePromedio {
  readonly tipo: 'promedio';
  readonly clave: string;
  /** |gasto − promedio|. */
  readonly impacto: Centavos;
  readonly estado: 'informacion';
  readonly categoria: Ref;
  readonly gasto: Centavos;
  readonly promedio: Centavos;
  /** Puntos básicos; negativa si el gasto es menor que el promedio. */
  readonly variacion: number;
  readonly accion: { readonly tipo: 'revisar'; readonly categoriaId: Uuid };
}

export interface CategoriaDeRealidad {
  readonly categoria: Ref;
  readonly grupo: Ref;
  readonly periodos: readonly {
    readonly periodo: FechaLocal;
    readonly asignado: Centavos;
    readonly gastado: Centavos;
  }[];
  readonly promedioGastado: Centavos | null;
  readonly sugerido: Centavos | null;
  readonly gastoComparado: Centavos;
  readonly variacion: number | null;
}

export interface RealidadSel {
  readonly periodo: PeriodoDto;
  readonly categorias: readonly CategoriaDeRealidad[];
  /** Por impacto descendente; a igual impacto, realidad antes que promedio y después por clave. */
  readonly hallazgos: readonly (HallazgoDeRealidad | HallazgoDePromedio)[];
}

const valorAbsoluto = (x: Centavos): Centavos => Centavos.max(x, Centavos.negar(x));

/** Promedio de `n` montos al centavo, mitad hacia arriba (simétrico en negativos). */
function promedio(xs: readonly Centavos[]): Centavos {
  const total = suma(xs);
  const p = Centavos.proporcionMitadArriba(valorAbsoluto(total), 1, xs.length);
  return total < 0 ? Centavos.negar(p) : p;
}

/** Sugerido: el promedio redondeado al dólar entero (3.5.6). */
const alDolar = (x: Centavos): Centavos =>
  Centavos.desdeEntero(
    Centavos.proporcionMitadArriba(Centavos.max(Centavos.cero, x), 1, 100) * 100,
  );

const tolerancia = (asig: Centavos): Centavos =>
  Centavos.max(
    REAL_TOL_MIN,
    Centavos.proporcionMitadArriba(valorAbsoluto(asig), REAL_TOL_PCT[0], REAL_TOL_PCT[1]),
  );

const ORDEN_DE_TIPO = { realidad: 0, promedio: 1 } as const;

/** El reporte `realidad` sobre el período activo y los 3 cerrados anteriores en que existía cada categoría. */
export function realidad(i: Instantanea): RealidadSel {
  const h = i.hechos;
  const a = i.presupuesto.activo;
  const nom = nombres(i);
  const m = medidor(i);
  const deRitmo = new Map(ritmo(i).categorias.map((x) => [x.categoria.id, x]));
  const cerrados = i.presupuesto.periodos.filter((p) => p.fin < a.inicio);
  const sinMeta = (c: Uuid) =>
    !h.metas.some((x) => x.categoriaId === c && (x.tipo === 'anual' || x.tipo === 'para_fecha'));
  const grupos = new Map(h.grupos.map((g) => [g.id, g]));

  const categorias: CategoriaDeRealidad[] = [];
  const hallazgos: (HallazgoDeRealidad | HallazgoDePromedio)[] = [];
  const normales = h.categorias
    .filter((c) => c.clase === 'normal' && !c.archivada)
    .sort(
      (x, y) =>
        (grupos.get(x.grupoId)?.orden ?? 0) - (grupos.get(y.grupoId)?.orden ?? 0) ||
        x.orden - y.orden,
    );
  for (const c of normales) {
    const r = deRitmo.get(c.id);
    if (r === undefined) continue;
    const previos: Periodo[] = cerrados
      .filter((q) => existiaEn(i, c.id, q))
      .slice(-PERIODOS_DE_COMPARACION);
    const filas = previos.map((q) => ({
      periodo: q.inicio,
      asignado: asignado(h.asignaciones, c.id, q),
      gastado: m.gastado(c.id, q),
    }));
    const completo = filas.length === PERIODOS_DE_COMPARACION;
    const prom = completo ? promedio(filas.map((x) => x.gastado)) : null;
    const sugerido = prom === null ? null : alDolar(prom);
    const asigA = asignado(h.asignaciones, c.id, a);
    const gastoComparado = Centavos.sumar(
      Centavos.sumar(m.gastado(c.id, a), r.proyeccionVariable),
      r.programadasPendientes,
    );
    const evaluaPromedio = prom !== null && prom > 0;
    categorias.push({
      categoria: nom.categoria(c.id),
      grupo: nom.grupo(c.grupoId),
      periodos: filas,
      promedioGastado: prom,
      sugerido,
      gastoComparado,
      variacion: evaluaPromedio ? puntosBasicos(Centavos.restar(gastoComparado, prom), prom) : null,
    });
    if (prom === null || sugerido === null) continue;

    const pasas = filas.every(
      (x) => x.gastado > Centavos.sumar(x.asignado, tolerancia(x.asignado)),
    );
    const sobra = filas.every(
      (x) => x.gastado < Centavos.restar(x.asignado, tolerancia(x.asignado)) && x.gastado > 0,
    );
    if ((pasas || sobra) && sugerido !== asigA && sinMeta(c.id)) {
      const meta = h.metas.find(
        (x) => x.categoriaId === c.id && (x.tipo === 'mensual' || x.tipo === 'semanal'),
      );
      hallazgos.push({
        tipo: 'realidad',
        clave: `categoria:${c.id}`,
        impacto: valorAbsoluto(Centavos.restar(sugerido, asigA)),
        estado: 'advertencia',
        categoria: nom.categoria(c.id),
        causa: pasas ? 'pasas' : 'sobra',
        promedioGastado: prom,
        asignadoPromedio: promedio(filas.map((x) => x.asignado)),
        sugerido,
        accion:
          meta === undefined
            ? { tipo: 'asignar', montoNuevo: sugerido }
            : { tipo: 'meta', metaId: meta.id, monto: sugerido },
      });
    }

    const diferencia = valorAbsoluto(Centavos.restar(gastoComparado, prom));
    if (
      evaluaPromedio &&
      diferencia >= PROM_VAR_MIN &&
      diferencia * PROM_VAR_PCT[1] >= prom * PROM_VAR_PCT[0]
    )
      hallazgos.push({
        tipo: 'promedio',
        clave: `categoria:${c.id}`,
        impacto: diferencia,
        estado: 'informacion',
        categoria: nom.categoria(c.id),
        gasto: gastoComparado,
        promedio: prom,
        variacion: puntosBasicos(Centavos.restar(gastoComparado, prom), prom),
        accion: { tipo: 'revisar', categoriaId: c.id },
      });
  }

  hallazgos.sort(
    (x, y) =>
      y.impacto - x.impacto ||
      ORDEN_DE_TIPO[x.tipo] - ORDEN_DE_TIPO[y.tipo] ||
      (x.clave < y.clave ? -1 : x.clave > y.clave ? 1 : 0),
  );
  return { periodo: periodoDto(i, a), categorias, hallazgos };
}
