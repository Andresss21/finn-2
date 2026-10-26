// Actividad y la fila de transacción (04 §6.7.1). Todo sale de la instantánea; la búsqueda por texto
// llega como el conjunto de ids que ya resolvió la consulta (`nota` no está en los hechos, 5.2).
import type {
  Efecto,
  EstadoBancario,
  Instantanea,
  Linea,
  OrigenTransaccion,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { nombres, type Ref } from './comunes';

export interface TransaccionFila {
  readonly id: Uuid;
  readonly fecha: FechaLocal;
  readonly tipo: TipoTransaccion;
  readonly cuentas: readonly { readonly cuenta: Ref; readonly monto: Centavos }[];
  readonly comercio: string | null;
  readonly total: Centavos;
  /** Gasto y salidas en negativo; ingresos y entradas en positivo; 0 en movimientos neutros. */
  readonly montoPresentado: Centavos;
  readonly lineas: readonly {
    readonly destino: Ref & { readonly tipo: 'categoria' | 'deudor' };
    readonly monto: Centavos;
  }[];
  readonly estadoBancario: EstadoBancario;
  readonly origen: OrigenTransaccion;
  readonly marcas: {
    readonly porCobrar: boolean;
    readonly conDevoluciones: boolean;
    readonly conciliada: boolean;
    readonly programada: boolean;
    readonly periodoCerrado: boolean;
  };
}

export interface FiltroDeActividad {
  /** Ids de `comercio ILIKE` o `nota ILIKE` que resolvió la consulta. */
  readonly idsDeTexto?: ReadonlySet<Uuid>;
  readonly montoDesde?: Centavos;
  readonly montoHasta?: Centavos;
  readonly categoriaId?: Uuid;
  readonly cuentaId?: Uuid;
  readonly desde?: FechaLocal;
  readonly hasta?: FechaLocal;
  readonly estado?: EstadoBancario;
  readonly tipo?: TipoTransaccion;
  readonly origen?: OrigenTransaccion;
  readonly cursor?: string;
  readonly limite?: number;
}

export interface ActividadDto {
  readonly dias: readonly {
    readonly fecha: FechaLocal;
    readonly transacciones: readonly TransaccionFila[];
  }[];
  readonly siguienteCursor?: string;
}

interface Indice {
  readonly efectos: ReadonlyMap<Uuid, readonly Efecto[]>;
  readonly lineas: ReadonlyMap<Uuid, readonly Linea[]>;
  readonly linea: ReadonlyMap<Uuid, Linea>;
  /** Transacciones con alguna línea que otra línea devuelve. */
  readonly conDevoluciones: ReadonlySet<Uuid>;
}

const memoria = new WeakMap<Instantanea, Indice>();

function agrupar<T extends { readonly transaccionId: Uuid }>(xs: readonly T[]): Map<Uuid, T[]> {
  const m = new Map<Uuid, T[]>();
  for (const x of xs) m.set(x.transaccionId, [...(m.get(x.transaccionId) ?? []), x]);
  return m;
}

export function indice(i: Instantanea): Indice {
  let x = memoria.get(i);
  if (x === undefined) {
    const linea = new Map(i.hechos.lineas.map((l) => [l.id, l]));
    x = {
      efectos: agrupar(i.hechos.efectos),
      lineas: agrupar(i.hechos.lineas),
      linea,
      conDevoluciones: new Set(
        i.hechos.lineas.flatMap((l) => {
          const o = l.lineaOriginalId === null ? undefined : linea.get(l.lineaOriginalId);
          return o === undefined ? [] : [o.transaccionId];
        }),
      ),
    };
    memoria.set(i, x);
  }
  return x;
}

/** Clave del orden (fecha, clave de orden, secuencia, id): ascendente es el orden del motor (6.0.6). */
export const claveDe = (t: Transaccion): string =>
  `${t.fecha}|${t.claveOrden}|${t.secuencia === null ? '~' : t.secuencia.padStart(20, '0')}|${t.id}`;

const SALIDAS: ReadonlySet<string> = new Set([
  'gasto',
  'pago_tarjeta',
  'cuota_prestamo',
  'abono_capital',
  'aporte_inversion',
]);
const NEUTROS: ReadonlySet<string> = new Set(['transferencia', 'transferencia_tarjetas']);

function presentado(t: Transaccion, efectos: readonly Efecto[]): Centavos {
  if (NEUTROS.has(t.tipo)) return Centavos.cero;
  if (SALIDAS.has(t.tipo)) return Centavos.negar(t.total);
  if (t.tipo === 'saldo_inicial' || t.tipo === 'ajuste_inversion')
    return efectos.reduce((s, e) => Centavos.sumar(s, e.monto), Centavos.cero);
  return t.total;
}

/** Destino de una línea; la de una devolución sin destino propio sigue a su línea original. */
function destinoDe(i: Instantanea, l: Linea): TransaccionFila['lineas'][number]['destino'] {
  const propio = l.categoriaId !== null || l.deudorId !== null;
  const origen = l.lineaOriginalId === null ? undefined : indice(i).linea.get(l.lineaOriginalId);
  const o = propio ? l : origen;
  if (o?.categoriaId != null) return { ...nombres(i).categoria(o.categoriaId), tipo: 'categoria' };
  const d = i.hechos.deudores.find((x) => x.id === o?.deudorId);
  if (d === undefined) throw new RangeError(`la línea ${l.id} no tiene destino`);
  return { id: d.id, nombre: d.nombre, tipo: 'deudor' };
}

export function filaDe(i: Instantanea, t: Transaccion): TransaccionFila {
  const x = indice(i);
  const n = nombres(i);
  const efectos = x.efectos.get(t.id) ?? [];
  const lineas = x.lineas.get(t.id) ?? [];
  return {
    id: t.id,
    fecha: t.fecha,
    tipo: t.tipo,
    cuentas: efectos.map((e) => ({ cuenta: n.cuenta(e.cuentaId), monto: e.monto })),
    comercio: t.comercio,
    total: t.total,
    montoPresentado: presentado(t, efectos),
    lineas: lineas.map((l) => ({ destino: destinoDe(i, l), monto: l.monto })),
    estadoBancario: t.estadoBancario,
    origen: t.origen,
    marcas: {
      porCobrar: lineas.some((l) => l.deudorId !== null),
      conDevoluciones: x.conDevoluciones.has(t.id),
      conciliada: t.estadoBancario === 'conciliada',
      programada: t.origen === 'programada',
      periodoCerrado: t.fecha < i.presupuesto.activo.inicio,
    },
  };
}

/** Página en orden inverso (fecha, clave de orden, secuencia) con cursor; 50 por defecto, 100 como máximo. */
export function paginar<T extends { readonly t: Transaccion }>(
  xs: readonly T[],
  cursor: string | undefined,
  limite = 50,
): { readonly pagina: T[]; readonly siguienteCursor?: string } {
  const tope = Math.min(100, Math.max(1, limite));
  const orden = [...xs].sort((a, b) => (claveDe(a.t) < claveDe(b.t) ? 1 : -1));
  const resto = cursor === undefined ? orden : orden.filter((x) => claveDe(x.t) < cursor);
  const pagina = resto.slice(0, tope);
  const ultima = pagina[pagina.length - 1];
  return resto.length > tope && ultima !== undefined
    ? { pagina, siguienteCursor: claveDe(ultima.t) }
    : { pagina };
}

/** `consultas.actividad` (6.7.1): los filtros se aplican sobre los hechos en memoria. */
export function actividad(i: Instantanea, f: FiltroDeActividad = {}): ActividadDto {
  const x = indice(i);
  const candidatas = i.hechos.transacciones
    .filter(
      (t) =>
        (f.idsDeTexto === undefined || f.idsDeTexto.has(t.id)) &&
        (f.montoDesde === undefined || t.total >= f.montoDesde) &&
        (f.montoHasta === undefined || t.total <= f.montoHasta) &&
        (f.desde === undefined || t.fecha >= f.desde) &&
        (f.hasta === undefined || t.fecha <= f.hasta) &&
        (f.estado === undefined || t.estadoBancario === f.estado) &&
        (f.tipo === undefined || t.tipo === f.tipo) &&
        (f.origen === undefined || t.origen === f.origen) &&
        (f.cuentaId === undefined ||
          (x.efectos.get(t.id) ?? []).some((e) => e.cuentaId === f.cuentaId)) &&
        (f.categoriaId === undefined ||
          (x.lineas.get(t.id) ?? []).some((l) => l.categoriaId === f.categoriaId)),
    )
    .map((t) => ({ t }));
  const { pagina, siguienteCursor } = paginar(candidatas, f.cursor, f.limite);
  const dias: { fecha: FechaLocal; transacciones: TransaccionFila[] }[] = [];
  for (const { t } of pagina) {
    const ultimo = dias[dias.length - 1];
    if (ultimo?.fecha === t.fecha) ultimo.transacciones.push(filaDe(i, t));
    else dias.push({ fecha: t.fecha, transacciones: [filaDe(i, t)] });
  }
  return siguienteCursor === undefined ? { dias } : { dias, siguienteCursor };
}
