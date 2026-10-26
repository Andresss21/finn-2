// Selector de Presupuesto (04 §6.2, BE-39, CF-25 en 06 §5.8): las filas, los grupos y los totales de un
// período salen de las celdas de la instantánea (§4.6); `gastado` y `existiaEn` son los selectores de
// reportes. No hay fórmulas propias: solo filtros, agrupación y las proporciones de CF-25. Fuera del
// selector queda el `Encabezado` (lo arma la consulta, 6.0.2).
import type { RepartoD2 } from '../calculo/d2';
import type { Celda } from '../calculo/disponible';
import type { EstadoDeMeta } from '../calculo/metas';
import { type Periodo, periodoDe } from '../calculo/periodos';
import { pagoExcedente } from '../calculo/sobregiros';
import type { Categoria, Instantanea, TipoMeta, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import {
  type CausaDeExcedente,
  causasDelExcedente,
  nombres,
  type PeriodoDto,
  periodoDto,
  type Ref,
  type SobregiroDto,
  sobregiroDe,
} from './comunes';
import { medidor, puntosBasicos, suma } from './reportes/comunes';
import { existiaEn } from './reportes/existia-en';

export type FiltroPresupuesto = 'todas' | 'sobregiradas' | 'sin_fondos' | 'cubiertas';
export type ClasificacionDeFila = 'sobregirada' | 'sin_fondos' | 'cubierta';

export interface BarraDeGastado {
  readonly cubiertoBp: number;
  readonly excedenteBp: number;
  readonly tipoExcedente: SobregiroDto['tipo'] | null;
  readonly metaBp?: number;
}

export interface FilaCategoria {
  readonly categoria: Ref;
  readonly orden: number;
  readonly asignado: Centavos;
  readonly gastado: Centavos;
  readonly arrastre: Centavos;
  readonly disponible: Centavos;
  readonly sobregiro: SobregiroDto | null;
  readonly meta: {
    readonly tipo: TipoMeta;
    readonly pedido: Centavos;
    readonly falta: Centavos;
    readonly estado: EstadoDeMeta;
  } | null;
  readonly clasificacion: ClasificacionDeFila;
  readonly asignadoEsperado: Centavos;
  readonly barra: BarraDeGastado | null;
}

export interface FilaPagoTarjeta {
  readonly tarjeta: Ref;
  readonly categoria: Ref;
  readonly asignado: Centavos;
  readonly actividad: Centavos;
  readonly arrastre: Centavos;
  readonly disponible: Centavos;
  readonly faltaReservar: Centavos;
  readonly reservaExcedente: Centavos;
  readonly pagoExcedente: { readonly total: Centavos; readonly causas: CausaDeExcedente[] } | null;
}

export interface TotalesDePresupuesto {
  readonly asignado: Centavos;
  readonly gastado: Centavos;
  readonly disponible: Centavos;
}

export interface PresupuestoSel {
  readonly periodo: PeriodoDto;
  readonly navegacion: { readonly anterior?: FechaLocal; readonly siguiente: FechaLocal };
  readonly lpa: Centavos;
  readonly enCamino: Centavos;
  readonly lpaNegativo: boolean;
  readonly grupos: {
    readonly grupo: Ref;
    readonly orden: number;
    readonly categorias: FilaCategoria[];
    readonly totales: TotalesDePresupuesto;
  }[];
  readonly pagosTarjeta: FilaPagoTarjeta[];
  readonly archivadasConDinero: FilaCategoria[];
  readonly totales: TotalesDePresupuesto;
}

const TOPE_BP = 10_000;
const CLASE_DEL_FILTRO = {
  sobregiradas: 'sobregirada',
  sin_fondos: 'sin_fondos',
  cubiertas: 'cubierta',
} as const;
const porOrden = <T extends { readonly orden: number }>(xs: readonly T[]): T[] =>
  [...xs].sort((a, b) => a.orden - b.orden);

/** Barra de gastado (CF-25): base y proporciones salen del reparto D2 y del sobregiro de la celda. */
function barraDe(
  r: RepartoD2 | undefined,
  x: Celda,
  metaBp: number | undefined,
): BarraDeGastado | null {
  if (r === undefined) return null;
  const cubierto = suma(r.partes.map((p) => p.cubierto));
  const excedente = Centavos.sumar(x.sobT, x.sobD);
  const base = Centavos.max(
    Centavos.max(Centavos.cero, r.fondo),
    Centavos.sumar(cubierto, excedente),
  );
  if (base === 0) return null;
  const excedenteBp = excedente > 0 ? Math.max(1, puntosBasicos(excedente, base)) : 0;
  const cubiertoBp = Math.max(0, Math.min(puntosBasicos(cubierto, base), TOPE_BP - excedenteBp));
  const barra = { cubiertoBp, excedenteBp, tipoExcedente: sobregiroDe(x)?.tipo ?? null };
  return metaBp === undefined ? barra : { ...barra, metaBp };
}

/**
 * El período `periodoInicio` (por defecto, el activo) con el filtro de BE-39. Un período fuera del rango
 * que calculó `calcular` (más allá del último con hechos o asignaciones) lanza `RangeError`: el motor no
 * lo extiende (ver "Contradicciones" del informe de TA-125).
 */
export function presupuesto(
  i: Instantanea,
  periodoInicio?: FechaLocal,
  filtro: FiltroPresupuesto = 'todas',
): PresupuestoSel {
  const b = i.presupuesto;
  const posicion = b.periodos.findIndex((q) => q.inicio === (periodoInicio ?? b.activo.inicio));
  const p: Periodo | undefined = b.periodos[posicion];
  if (p === undefined) throw new RangeError(`período ${periodoInicio} fuera del rango calculado`);
  const activo = p.inicio === b.activo.inicio;
  const cerrado = p.fin < i.hoy;
  const nom = nombres(i);
  const medida = medidor(i);
  const gastadoEn = (id: Uuid, r: Periodo) => medida.gastado(id, r);
  const celdas = b.celdas.filter((x) => x.periodo.inicio === p.inicio);
  const celdaDe = new Map(celdas.map((x) => [x.categoriaId, x]));
  const repartoDe = new Map(
    b.repartos.filter((r) => r.periodo.inicio === p.inicio).map((r) => [r.categoriaId, r]),
  );
  const metaDe = new Map(i.metas.map((m) => [m.categoriaId, m]));
  const hechoDeMeta = new Map(i.hechos.metas.map((m) => [m.id, m]));

  const fila = (id: Uuid, orden: number): FilaCategoria => {
    const x = celdaDe.get(id);
    if (x === undefined) throw new RangeError(`sin celda para ${id} en ${p.inicio}`);
    // Las metas solo se evalúan en el período activo (§4.12): en los demás, `meta` es null.
    const m = activo ? metaDe.get(id) : undefined;
    const ev = m?.evaluacion ?? null;
    const hecho = m === undefined ? undefined : hechoDeMeta.get(m.metaId);
    const ahorro = hecho !== undefined && (hecho.tipo === 'anual' || hecho.tipo === 'para_fecha');
    const metaBp =
      ev !== null && ahorro && hecho.monto > 0
        ? Math.min(TOPE_BP, puntosBasicos(Centavos.max(Centavos.cero, x.disponible), hecho.monto))
        : undefined;
    const clasificacion: ClasificacionDeFila =
      x.disponible < 0 ? 'sobregirada' : ev !== null && ev.falta > 0 ? 'sin_fondos' : 'cubierta';
    return {
      categoria: nom.categoria(id),
      orden,
      asignado: x.asignado,
      gastado: gastadoEn(id, p),
      arrastre: x.arrastre,
      disponible: x.disponible,
      sobregiro: sobregiroDe(x),
      meta:
        ev === null || hecho === undefined
          ? null
          : { tipo: hecho.tipo, pedido: ev.pedido, falta: ev.falta, estado: ev.estado },
      clasificacion,
      asignadoEsperado: x.asignado,
      barra: barraDe(repartoDe.get(id), x, metaBp),
    };
  };

  const normales = i.hechos.categorias.filter((x) => x.clase === 'normal');
  // R4: una archivada solo aparece en un período cerrado en que tuvo asignación o actividad.
  const visible = (x: Categoria) => !x.archivada || (cerrado && existiaEn(i, x.id, p));
  const cumple = (f: FilaCategoria) =>
    filtro === 'todas' || f.clasificacion === CLASE_DEL_FILTRO[filtro];
  const totalesDe = (filas: readonly FilaCategoria[]): TotalesDePresupuesto => ({
    asignado: suma(filas.map((f) => f.asignado)),
    gastado: suma(filas.map((f) => f.gastado)),
    disponible: suma(filas.map((f) => f.disponible)),
  });

  const grupos = porOrden(i.hechos.grupos).flatMap((g) => {
    const propias = normales.filter((x) => x.grupoId === g.id);
    if (propias.length === 0) return [];
    const todas = porOrden(propias.filter(visible)).map((x) => fila(x.id, x.orden));
    const categorias = todas.filter(cumple);
    if ((g.archivado || filtro !== 'todas') && categorias.length === 0) return [];
    return [{ grupo: nom.grupo(g.id), orden: g.orden, categorias, totales: totalesDe(todas) }];
  });

  const pagosTarjeta = porOrden(i.hechos.categorias.filter((x) => x.clase === 'pago')).flatMap(
    (x): FilaPagoTarjeta[] => {
      const c = celdaDe.get(x.id);
      if (c === undefined || x.tarjetaId === null) return [];
      // S y RE solo se calculan en el activo (inv. 2); los causales de E(t, A), también.
      const t = activo ? i.tarjetas.find((e) => e.tarjetaId === x.tarjetaId) : undefined;
      const exceso = pagoExcedente(c);
      return [
        {
          tarjeta: nom.cuenta(x.tarjetaId),
          categoria: nom.categoria(x.id),
          asignado: c.asignado,
          actividad: c.actividad,
          arrastre: c.arrastre,
          disponible: c.disponible,
          faltaReservar: t?.sinRespaldo ?? Centavos.cero,
          reservaExcedente: t?.reservaExcedente ?? Centavos.cero,
          pagoExcedente:
            activo && exceso > 0
              ? { total: exceso, causas: causasDelExcedente(i, x.tarjetaId) }
              : null,
        },
      ];
    },
  );

  const archivadasConDinero = activo
    ? porOrden(
        normales.filter((x) => x.archivada && (celdaDe.get(x.id)?.disponible ?? 0) !== 0),
      ).map((x) => fila(x.id, x.orden))
    : [];

  const anterior = posicion > 0 ? b.periodos[posicion - 1] : undefined;
  const conGastado = new Set(celdas.map((x) => x.categoriaId));
  return {
    periodo: periodoDto(i, p),
    navegacion: {
      ...(anterior === undefined ? {} : { anterior: anterior.inicio }),
      siguiente: periodoDe(i.ciclo, FechaLocal.sumarDias(p.fin, 1)).inicio,
    },
    lpa: i.lpa.total,
    enCamino: i.lpa.dineroEnCamino,
    lpaNegativo: i.lpa.total < 0,
    grupos,
    pagosTarjeta,
    archivadasConDinero,
    totales: {
      asignado: suma(celdas.map((x) => x.asignado)),
      disponible: suma(celdas.map((x) => x.disponible)),
      gastado: suma(normales.filter((x) => conGastado.has(x.id)).map((x) => gastadoEn(x.id, p))),
    },
  };
}
