// Detalle de una categoría normal (04 §6.3). Todo sale de la instantánea: la celda (§4.6), el reparto
// D2 (§4.5), los aportes (§4.4) y la meta evaluada (§4.12). El historial usa CF-17 (`existiaEn`).
// La categoría de pago (`DetallePagoTarjetaDto`) no entra en este selector. `reglas_comercio` es [H]
// y llega como parámetro.
import { gastado } from '../calculo/actividad';
import type { CasoDevolucion } from '../calculo/devoluciones';
import type { EstadoDeMeta } from '../calculo/metas';
import type { Periodo } from '../calculo/periodos';
import type { Instantanea, ReglaComercio, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import {
  type BloqueoDeArchivo,
  bloqueosDeArchivo,
  puedeArchivar,
  puedeEliminar,
  type Ref,
  refDe,
} from './estructura';
import { progresoDeMeta } from './metas';
import { contexto, puntosBasicos } from './reportes/comunes';
import { existiaEn } from './reportes/existia-en';

export interface SobregiroDeCategoria {
  readonly tipo: 'debito' | 'tarjeta' | 'mixto';
  readonly total: Centavos;
  readonly parteTarjeta: Centavos;
  readonly parteDebito: Centavos;
}

export interface DetalleCategoria {
  readonly categoria: Ref;
  readonly grupo: Ref;
  readonly clase: 'normal';
  readonly periodo: Periodo;
  /** Inicios de los períodos vecinos (CP-9). */
  readonly navegacion: { readonly anterior?: FechaLocal; readonly siguiente?: FechaLocal };
  readonly numeros: {
    readonly asignado: Centavos;
    readonly gastado: Centavos;
    readonly arrastre: Centavos;
    readonly disponible: Centavos;
    readonly fondo: Centavos;
    readonly entradas: Centavos;
  };
  readonly sobregiro: SobregiroDeCategoria | null;
  readonly consumos: readonly {
    readonly origen: { readonly transaccionId: Uuid } | { readonly condonacionId: Uuid };
    readonly fecha: FechaLocal;
    readonly comercio: string | null;
    readonly cuenta: Ref;
    readonly medio: 'tarjeta' | 'debito';
    readonly montoNeto: Centavos;
    readonly cubierto: Centavos;
    readonly noCubierto: Centavos;
  }[];
  readonly entradasDelPeriodo: readonly {
    readonly transaccionId: Uuid;
    readonly fecha: FechaLocal;
    readonly monto: Centavos;
    readonly caso: Exclude<CasoDevolucion, 'D-1'>;
  }[];
  readonly meta: {
    readonly tipo: string;
    readonly modo?: string;
    readonly monto: Centavos;
    readonly montoPeriodo?: Centavos;
    readonly base: Centavos;
    readonly n?: number;
    readonly fechaObjetivoVigente?: FechaLocal;
    readonly pedido: Centavos;
    readonly falta: Centavos;
    readonly estado: EstadoDeMeta;
    readonly progresoBp?: number;
  } | null;
  /** Días con gasto ≠ 0 (R8); intensidad = máx(0, gastado) / máximo del período (CF-25). */
  readonly calendario: readonly {
    readonly fecha: FechaLocal;
    readonly gastado: Centavos;
    readonly intensidadBp: number;
  }[];
  readonly historialResumen: {
    readonly promedioGastado: Centavos;
    readonly periodosExcedidos: number;
  };
  /** Hasta 6 períodos cerrados anteriores en que existía la categoría (CF-17), del más antiguo al más reciente. */
  readonly historial: readonly {
    readonly periodo: Periodo;
    readonly asignado: Centavos;
    readonly gastado: Centavos;
    readonly disponible: Centavos;
  }[];
  readonly programadas: readonly {
    readonly programada: Ref;
    readonly monto: Centavos;
    readonly proxima?: FechaLocal;
  }[];
  readonly reglas: readonly { readonly id: Uuid; readonly patron: string }[];
  readonly acciones: {
    readonly puedeAsignar: boolean;
    readonly puedeArchivar: boolean;
    readonly bloqueosArchivo: readonly BloqueoDeArchivo[];
    readonly puedeEliminar: boolean;
    readonly asignadoEsperado: Centavos;
  };
}

/** Suma / n en centavos, mitad hacia arriba y simétrico en negativos. */
function promedio(total: Centavos, n: number): Centavos {
  const p = Centavos.proporcionMitadArriba(Centavos.max(total, Centavos.negar(total)), 1, n);
  return total < 0 ? Centavos.negar(p) : p;
}

/**
 * `consultas.detalleCategoria` de una categoría normal (04 §6.3) en el período que empieza en
 * `periodoInicio` (por defecto, el activo). Lanza `RangeError` si la categoría no existe, es de
 * pago o el período no está en el presupuesto; la consulta lo traduce a `NO_ENCONTRADO`.
 */
export function detalleCategoria(
  i: Instantanea,
  categoriaId: Uuid,
  opciones: {
    readonly periodoInicio?: FechaLocal;
    readonly reglas?: readonly ReglaComercio[];
  } = {},
): DetalleCategoria {
  const h = i.hechos;
  const cat = h.categorias.find((x) => x.id === categoriaId);
  if (cat === undefined) throw new RangeError(`la categoría ${categoriaId} no existe`);
  if (cat.clase !== 'normal') throw new RangeError(`la categoría ${categoriaId} es de pago`);
  const grupo = h.grupos.find((x) => x.id === cat.grupoId);
  if (grupo === undefined) throw new RangeError(`la categoría ${categoriaId} no tiene grupo`);
  const { periodos, celdas, repartos, aportes } = i.presupuesto;
  const inicio = opciones.periodoInicio ?? i.presupuesto.activo.inicio;
  const k = periodos.findIndex((p) => p.inicio === inicio);
  const deC = <T extends { categoriaId: Uuid; periodo: Periodo }>(
    xs: readonly T[],
    desde: FechaLocal,
  ) => xs.find((x) => x.categoriaId === categoriaId && x.periodo.inicio === desde);
  const celda = deC(celdas, inicio);
  const reparto = deC(repartos, inicio);
  if (k < 0 || celda === undefined || reparto === undefined)
    throw new RangeError(`el período ${inicio} no está en el presupuesto`);
  const p = celda.periodo;
  const dentro = (f: FechaLocal) => p.inicio <= f && f <= p.fin;
  const cx = contexto(i);
  const transaccion = new Map(h.transacciones.map((t) => [t.id, t]));
  const txDeLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const cuentas = new Map(h.cuentas.map((c) => [c.id, c]));
  const sobre = Centavos.sumar(celda.sobT, celda.sobD);
  const evaluada = i.metas.find((m) => m.categoriaId === categoriaId)?.evaluacion ?? null;
  const meta = h.metas.find((m) => m.categoriaId === categoriaId);
  const celdaActiva = deC(celdas, i.presupuesto.activo.inicio);
  const progresoBp =
    meta === undefined || celdaActiva === undefined
      ? undefined
      : progresoDeMeta(meta.tipo, celdaActiva.disponible, meta.monto);

  // Calendario: gastado de cada día con consumos o entradas, como Gastado restringido a la fecha.
  const dias = new Set(
    [...cx.consumos, ...aportes]
      .filter((x) => x.categoriaId === categoriaId && dentro(x.fecha))
      .map((x) => x.fecha),
  );
  const porDia = [...dias]
    .sort()
    .map((fecha) => ({
      fecha,
      gastado: gastado(cx.consumos, aportes, categoriaId, {
        inicio: fecha,
        fin: fecha,
        transicion: false,
      }),
    }))
    .filter((d) => d.gastado !== 0);
  const maximo = porDia.reduce((m, d) => Centavos.max(m, d.gastado), Centavos.cero);
  const historial = celdas
    .filter(
      (x) =>
        x.categoriaId === categoriaId &&
        x.estado === 'cerrado' &&
        x.periodo.fin < p.inicio &&
        existiaEn(i, categoriaId, x.periodo),
    )
    .slice(-6)
    .map((x) => ({
      periodo: x.periodo,
      asignado: x.asignado,
      gastado: Centavos.negar(x.actividad),
      disponible: x.disponible,
    }));
  const activas = new Map(h.programadas.filter((x) => x.activa).map((x) => [x.id, x]));
  const proxima = (programadaId: Uuid) => {
    const f = i.ocurrencias
      .filter((o) => o.programadaId === programadaId)
      .map((o) => o.fecha)
      .sort()[0];
    return f === undefined ? {} : { proxima: f };
  };

  return {
    categoria: refDe(cat),
    grupo: refDe({ id: grupo.id, nombre: grupo.nombre, archivada: grupo.archivado }),
    clase: 'normal',
    periodo: p,
    navegacion: {
      ...(k > 0 ? { anterior: periodos[k - 1]?.inicio as FechaLocal } : {}),
      ...(k < periodos.length - 1 ? { siguiente: periodos[k + 1]?.inicio as FechaLocal } : {}),
    },
    numeros: {
      asignado: celda.asignado,
      gastado: Centavos.negar(celda.actividad),
      arrastre: celda.arrastre,
      disponible: celda.disponible,
      fondo: reparto.fondo,
      entradas: reparto.entradas,
    },
    sobregiro:
      sobre === 0
        ? null
        : {
            tipo: celda.sobD === 0 ? 'tarjeta' : celda.sobT === 0 ? 'debito' : 'mixto',
            total: sobre,
            parteTarjeta: celda.sobT,
            parteDebito: celda.sobD,
          },
    consumos: reparto.partes.map((x) => {
      const k2 = x.consumo;
      const origen =
        k2.fuente === 'linea'
          ? { transaccionId: txDeLinea.get(k2.id) as Uuid }
          : { condonacionId: k2.id };
      return {
        origen,
        fecha: k2.fecha,
        comercio:
          'transaccionId' in origen
            ? (transaccion.get(origen.transaccionId)?.comercio ?? null)
            : null,
        cuenta: refDe(cuentas.get(k2.cuentaId) ?? { id: k2.cuentaId, nombre: '' }),
        medio: k2.tarjetaId === null ? ('debito' as const) : ('tarjeta' as const),
        montoNeto: k2.neto,
        cubierto: x.cubierto,
        noCubierto: x.noCubierto,
      };
    }),
    entradasDelPeriodo: aportes
      .filter((x) => x.categoriaId === categoriaId && dentro(x.fecha) && x.caso !== 'D-1')
      .map((x) => ({
        transaccionId: txDeLinea.get(x.lineaId) as Uuid,
        fecha: x.fecha,
        monto: x.aCategoria,
        caso: x.caso as Exclude<CasoDevolucion, 'D-1'>,
      })),
    meta:
      evaluada === null || meta === undefined
        ? null
        : {
            tipo: meta.tipo,
            ...(meta.modo === null ? {} : { modo: meta.modo }),
            monto: meta.monto,
            ...(evaluada.montoDelPeriodo === null
              ? {}
              : { montoPeriodo: evaluada.montoDelPeriodo }),
            base: evaluada.base,
            ...(evaluada.periodosRestantes === null ? {} : { n: evaluada.periodosRestantes }),
            ...(evaluada.fechaObjetivo === null
              ? {}
              : { fechaObjetivoVigente: evaluada.fechaObjetivo }),
            pedido: evaluada.pedido,
            falta: evaluada.falta,
            estado: evaluada.estado,
            ...(progresoBp === undefined ? {} : { progresoBp }),
          },
    calendario: porDia.map((d) => ({
      ...d,
      intensidadBp: maximo <= 0 ? 0 : puntosBasicos(Centavos.max(Centavos.cero, d.gastado), maximo),
    })),
    historialResumen: {
      promedioGastado:
        historial.length === 0
          ? Centavos.cero
          : promedio(
              historial.reduce((s, x) => Centavos.sumar(s, x.gastado), Centavos.cero),
              historial.length,
            ),
      periodosExcedidos: historial.filter((x) => x.gastado > x.asignado).length,
    },
    historial,
    programadas: h.programada_lineas
      .filter((l) => l.categoriaId === categoriaId && activas.has(l.programadaId))
      .map((l) => ({
        programada: { id: l.programadaId, nombre: activas.get(l.programadaId)?.comercio ?? '' },
        monto: l.monto,
        ...proxima(l.programadaId),
      })),
    reglas: (opciones.reglas ?? [])
      .filter((x) => x.categoriaId === categoriaId)
      .map((x) => ({ id: x.id, patron: x.patron })),
    acciones: {
      puedeAsignar: p.inicio >= i.presupuesto.activo.inicio && !cat.archivada,
      puedeArchivar: puedeArchivar(cat),
      bloqueosArchivo: bloqueosDeArchivo(i, categoriaId),
      puedeEliminar: puedeEliminar(i, cat, opciones.reglas),
      asignadoEsperado: celda.asignado,
    },
  };
}
