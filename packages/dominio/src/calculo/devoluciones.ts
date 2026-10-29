// Consumos, consumo neto y clasificación D-1 a D-4 de las devoluciones (01 §4.4; §4.1 conv. 2 y 6;
// CB-06, CB-32). Todo sale del estado actual de los hechos (inv. 26): el medio de pago y la cuenta
// de una línea son los de su transacción hoy, así que un cambio de medio reclasifica (CB-32).
import type { BigintTexto, Hechos, Instante, Linea, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { destinoDe } from './destino';
import { type Ciclo, periodoDe } from './periodos';

export type HechosDeConsumo = Pick<
  Hechos,
  'cuentas' | 'transacciones' | 'efectos' | 'lineas' | 'condonaciones'
>;

/** Posición en el orden cronológico (§4.1 conv. 2): (fecha, clave de orden, secuencia, orden). */
export interface Momento {
  readonly fecha: FechaLocal;
  readonly claveOrden: Instante;
  readonly secuencia: BigintTexto | null;
  readonly orden: number;
}

/** Medio de pago (1.3): la cuenta de efectivo o tarjeta que mueve la transacción. */
export interface Medio {
  readonly cuentaId: Uuid;
  /** La tarjeta, o `null` si es débito o efectivo. */
  readonly tarjetaId: Uuid | null;
}

/** Un consumo de §4.1 conv. 6: una línea de categoría o una condonación. */
export interface Consumo extends Momento, Medio {
  readonly id: Uuid;
  readonly fuente: 'linea' | 'condonacion';
  readonly categoriaId: Uuid;
  readonly monto: Centavos;
  /** m_k = monto − Σ X de sus devoluciones D-1. */
  readonly neto: Centavos;
}

export type CasoDevolucion = 'D-1' | 'D-2' | 'D-3' | 'D-4';

/** Una línea de devolución a categoría, clasificada (las de por cobrar siguen §4.10). */
export interface Devolucion extends Momento, Medio {
  readonly lineaId: Uuid;
  readonly categoriaId: Uuid;
  readonly monto: Centavos;
  /** Inicio del período q de la devolución. */
  readonly periodo: FechaLocal;
  /** L: la línea original de categoría, si la hay. */
  readonly lineaOriginalId: Uuid | null;
  readonly caso: CasoDevolucion;
}

/** Aporte de una devolución D-2 a D-4 en su período q (D-1 no aporta: netea). */
export interface Aporte extends Devolucion {
  /** Parte a de D-3: solo reduce la deuda. 0 en los demás casos. */
  readonly a: Centavos;
  /** +X (D-2, D-4) o +r (D-3) a la categoría. */
  readonly aCategoria: Centavos;
  /** −r (D-3) o −X (D-4) a pago(t); 0 en D-2. */
  readonly aPago: Centavos;
}

/** U_L: parte no cubierta del consumo L en su período, después del neteo (§4.5, TA-105). */
export type NoCubierta = (lineaId: Uuid) => Centavos;

const TIPOS_DE_CONSUMO = new Set(['gasto', 'cuota_prestamo', 'abono_capital', 'aporte_inversion']);

/** La clave sin la fecha ni la clave de orden: `${fecha}|${claveOrden}|${cola(m)}` es la completa. */
const cola = (m: Momento) =>
  `${m.secuencia === null ? '~' : m.secuencia.padStart(20, '0')}|${String(m.orden).padStart(6, '0')}`;

const comparar = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
const seisCifras = (n: number) => Number.isInteger(n) && n >= 0 && n <= 999_999;

/** Como comparar `String(orden).padStart(6, '0')`: entre 0 y 999.999 es comparar los números. */
const deOrden = (x: number, y: number) =>
  seisCifras(x) && seisCifras(y)
    ? x - y
    : comparar(String(x).padStart(6, '0'), String(y).padStart(6, '0'));

/**
 * Dos momentos de la misma fecha, como sus claves `${claveOrden}|${cola}`: con la misma clave de
 * orden decide la cola; con claves de orden distintas del mismo largo, la primera diferencia está
 * antes del '|' y deciden ellas solas; con largos distintos se comparan las claves enteras.
 */
function delDia(a: Momento, b: Momento): number {
  if (a.claveOrden === b.claveOrden && a.secuencia === b.secuencia)
    return deOrden(a.orden, b.orden);
  if (a.claveOrden === b.claveOrden) return comparar(cola(a), cola(b));
  if (a.claveOrden.length === b.claveOrden.length) return a.claveOrden < b.claveOrden ? -1 : 1;
  return comparar(`${a.claveOrden}|${cola(a)}`, `${b.claveOrden}|${cola(b)}`);
}

/**
 * Ordena por (fecha, clave de orden, secuencia, orden); una fila sin secuencia va al final. Es el
 * orden de la clave `${fecha}|${claveOrden}|${cola}`: toda FechaLocal tiene 10 caracteres
 * ('AAAA-MM-DD', con año de 0000 a 9999), así que dos fechas distintas deciden solas y con la
 * misma fecha decide el resto (`delDia`). Por eso basta agrupar por fecha (en orden de llegada),
 * ordenar las fechas y, dentro de cada una, ordenar con `delDia`: es el mismo orden estable [BE-23].
 */
export function cronologico<T extends Momento>(xs: readonly T[]): T[] {
  const porFecha = new Map<FechaLocal, T[]>();
  for (const x of xs) {
    const ys = porFecha.get(x.fecha);
    if (ys === undefined) porFecha.set(x.fecha, [x]);
    else ys.push(x);
  }
  const r: T[] = [];
  for (const f of [...porFecha.keys()].sort()) {
    const ys = porFecha.get(f) as T[];
    if (ys.length > 1) ys.sort(delDia);
    for (const y of ys) r.push(y);
  }
  return r;
}

/** Las filas por id, una vez por pasada [BE-23]; con ids repetidos queda la última. */
export function porId<T extends { readonly id: Uuid }>(xs: readonly T[]): Map<Uuid, T> {
  const m = new Map<Uuid, T>();
  for (const x of xs) m.set(x.id, x);
  return m;
}

/** El medio de cada transacción: la cuenta de efectivo o tarjeta de sus efectos (la última). Las
 * transacciones de una misma cuenta comparten su `Medio`, que es inmutable. */
export function mediosDe(h: Pick<Hechos, 'cuentas' | 'efectos'>): Map<Uuid, Medio> {
  const deCuenta = new Map<Uuid, Medio>();
  for (const k of h.cuentas)
    if (k.tipo === 'efectivo' || k.tipo === 'tarjeta')
      deCuenta.set(k.id, { cuentaId: k.id, tarjetaId: k.tipo === 'tarjeta' ? k.id : null });
    else deCuenta.delete(k.id);
  const m = new Map<Uuid, Medio>();
  for (const e of h.efectos) {
    const x = deCuenta.get(e.cuentaId);
    if (x !== undefined) m.set(e.transaccionId, x);
  }
  return m;
}

function indice(
  h: HechosDeConsumo,
  transacciones: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
  medios: ReadonlyMap<Uuid, Medio> = mediosDe(h),
) {
  const cuentas = new Set(h.cuentas.map((k) => k.id));
  for (const e of h.efectos)
    if (!cuentas.has(e.cuentaId)) throw new RangeError(`efecto ${e.id} con cuenta desconocida`);
  // Solo se buscan por id las líneas originales de una devolución y las de una condonación.
  const buscadas = new Set<Uuid>(h.condonaciones.map((x) => x.lineaId));
  for (const l of h.lineas) if (l.lineaOriginalId !== null) buscadas.add(l.lineaOriginalId);
  const lineas = new Map<Uuid, Linea>();
  for (const l of h.lineas) if (buscadas.has(l.id)) lineas.set(l.id, l);
  const tx = (id: Uuid): Transaccion => {
    const t = transacciones.get(id);
    if (t === undefined) throw new RangeError(`transacción ${id} desconocida`);
    return t;
  };
  const medio = (id: Uuid): Medio => {
    const m = medios.get(id);
    if (m === undefined) throw new RangeError(`transacción ${id} sin cuenta de efectivo o tarjeta`);
    return m;
  };
  const momento = (l: Linea): Momento => {
    const t = tx(l.transaccionId);
    return { fecha: t.fecha, claveOrden: t.claveOrden, secuencia: t.secuencia, orden: l.orden };
  };
  return { transacciones, tx, medio, momento, lineas, linea: (id: Uuid) => lineas.get(id) };
}

/** Las devoluciones a categoría con su caso D-1 a D-4, en orden cronológico. */
export const clasificar = (h: HechosDeConsumo, c: Ciclo): Devolucion[] =>
  clasificarCon(h, c, indice(h));

function clasificarCon(h: HechosDeConsumo, c: Ciclo, ix: ReturnType<typeof indice>): Devolucion[] {
  const devoluciones = h.lineas.flatMap((e) => {
    // Una línea de una transacción conocida que no es devolución no entra, sea cual sea su destino.
    const t = ix.transacciones.get(e.transaccionId);
    if (t !== undefined && t.tipo !== 'devolucion') return [];
    const { categoriaId } = destinoDe(e, ix.lineas);
    if (categoriaId === null || ix.tx(e.transaccionId).tipo !== 'devolucion') return [];
    const m = ix.momento(e);
    const k = ix.medio(e.transaccionId);
    const q = periodoDe(c, m.fecha).inicio;
    const original = e.lineaOriginalId === null ? undefined : ix.linea(e.lineaOriginalId);
    const L = original?.categoriaId === null ? undefined : original;
    const deL = L === undefined ? undefined : ix.medio(L.transaccionId);
    const misma = deL !== undefined && deL.cuentaId === k.cuentaId;
    const caso: CasoDevolucion =
      misma && L !== undefined && periodoDe(c, ix.momento(L).fecha).inicio === q
        ? 'D-1'
        : k.tarjetaId === null
          ? 'D-2'
          : misma
            ? 'D-3'
            : 'D-4';
    return [
      {
        ...m,
        ...k,
        lineaId: e.id,
        categoriaId,
        monto: e.monto,
        periodo: q,
        lineaOriginalId: L?.id ?? null,
        caso,
      },
    ];
  });
  return cronologico(devoluciones);
}

/** Los consumos de §4.1 conv. 6 con su consumo neto, en orden cronológico. */
export const consumos = (h: HechosDeConsumo, c: Ciclo): Consumo[] => movimientos(h, c).consumos;

/** `consumos` y `clasificar` de los mismos hechos, con un solo índice (una pasada, BE-23). */
export interface Movimientos {
  readonly consumos: Consumo[];
  readonly devoluciones: Devolucion[];
}

export function movimientos(
  h: HechosDeConsumo,
  c: Ciclo,
  transacciones: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
  medios: ReadonlyMap<Uuid, Medio> = mediosDe(h),
): Movimientos {
  const ix = indice(h, transacciones, medios);
  const devoluciones = clasificarCon(h, c, ix);
  const neteado = new Map<Uuid, Centavos>();
  for (const d of devoluciones)
    if (d.caso === 'D-1' && d.lineaOriginalId !== null)
      neteado.set(
        d.lineaOriginalId,
        Centavos.sumar(neteado.get(d.lineaOriginalId) ?? Centavos.cero, d.monto),
      );
  // Cada consumo se arma de una vez, sin los objetos de `momento` y `medio` [BE-23].
  const todos: Consumo[] = [];
  for (const l of h.lineas) {
    if (l.categoriaId === null) continue;
    const t = ix.tx(l.transaccionId);
    if (!TIPOS_DE_CONSUMO.has(t.tipo)) continue;
    const neto = Centavos.restar(l.monto, neteado.get(l.id) ?? Centavos.cero);
    const k = ix.medio(l.transaccionId);
    todos.push({
      fecha: t.fecha,
      claveOrden: t.claveOrden,
      secuencia: t.secuencia,
      orden: l.orden,
      cuentaId: k.cuentaId,
      tarjetaId: k.tarjetaId,
      id: l.id,
      fuente: 'linea',
      categoriaId: l.categoriaId,
      monto: l.monto,
      neto,
    });
  }
  for (const x of h.condonaciones) {
    const porCobrar = ix.linea(x.lineaId);
    if (porCobrar === undefined) throw new RangeError(`condonación ${x.id} sin su línea`);
    const k = ix.medio(porCobrar.transaccionId);
    todos.push({
      fecha: x.fecha,
      claveOrden: x.claveOrden,
      secuencia: x.secuencia,
      orden: 0,
      cuentaId: k.cuentaId,
      tarjetaId: k.tarjetaId,
      id: x.id,
      fuente: 'condonacion',
      categoriaId: x.categoriaId,
      monto: x.monto,
      neto: x.monto,
    });
  }
  return { consumos: cronologico(todos), devoluciones };
}

/**
 * Aportes de las devoluciones D-2 a D-4. En D-3, a = mín(X, U_L − A_L) y r = X − a, con A_L la
 * suma de las partes a de las D-3 anteriores de L, en orden cronológico.
 */
export const aportes = (h: HechosDeConsumo, c: Ciclo, noCubierta: NoCubierta): Aporte[] =>
  aportesDe(clasificar(h, c), noCubierta);

/** `aportes` sobre devoluciones clasificadas, en orden cronológico. A_L solo depende de las D-3
 * anteriores de la misma L: basta con pasar esas y las que interesan. */
export function aportesDe(devoluciones: readonly Devolucion[], noCubierta: NoCubierta): Aporte[] {
  const acumulado = new Map<Uuid, Centavos>();
  return devoluciones.flatMap((d): Aporte[] => {
    const cero = Centavos.cero;
    if (d.caso === 'D-1') return [];
    if (d.caso === 'D-2') return [{ ...d, a: cero, aCategoria: d.monto, aPago: cero }];
    let a = cero;
    if (d.caso === 'D-3' && d.lineaOriginalId !== null) {
      const previo = acumulado.get(d.lineaOriginalId) ?? cero;
      a = Centavos.min(d.monto, Centavos.restar(noCubierta(d.lineaOriginalId), previo));
      acumulado.set(d.lineaOriginalId, Centavos.sumar(previo, a));
    }
    const r = Centavos.restar(d.monto, a);
    return [{ ...d, a, aCategoria: r, aPago: Centavos.negar(r) }];
  });
}
