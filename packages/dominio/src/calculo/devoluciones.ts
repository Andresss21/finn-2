// Consumos, consumo neto y clasificación D-1 a D-4 de las devoluciones (01 §4.4; §4.1 conv. 2 y 6;
// CB-06, CB-32). Todo sale del estado actual de los hechos (inv. 26): el medio de pago y la cuenta
// de una línea son los de su transacción hoy, así que un cambio de medio reclasifica (CB-32).
import type { BigintTexto, Hechos, Instante, Linea, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
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

const clave = (m: Momento) =>
  `${m.fecha}|${m.claveOrden}|${m.secuencia === null ? '~' : m.secuencia.padStart(20, '0')}|${String(m.orden).padStart(6, '0')}`;

/** Ordena por (fecha, clave de orden, secuencia, orden); una fila sin secuencia va al final. */
export const cronologico = <T extends Momento>(xs: readonly T[]): T[] =>
  xs
    .map((x) => [clave(x), x] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, x]) => x);

function indice(h: HechosDeConsumo) {
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k]));
  const transacciones = new Map(h.transacciones.map((t) => [t.id, t]));
  const lineas = new Map(h.lineas.map((l) => [l.id, l]));
  const medios = new Map<Uuid, Medio>();
  for (const e of h.efectos) {
    const k = cuentas.get(e.cuentaId);
    if (k === undefined) throw new RangeError(`efecto ${e.id} con cuenta desconocida`);
    if (k.tipo === 'efectivo' || k.tipo === 'tarjeta')
      medios.set(e.transaccionId, {
        cuentaId: k.id,
        tarjetaId: k.tipo === 'tarjeta' ? k.id : null,
      });
  }
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
  return { tx, medio, momento, linea: (id: Uuid) => lineas.get(id) };
}

/** Las devoluciones a categoría con su caso D-1 a D-4, en orden cronológico. */
export function clasificar(h: HechosDeConsumo, c: Ciclo): Devolucion[] {
  const ix = indice(h);
  const devoluciones = h.lineas.flatMap((e) => {
    if (e.categoriaId === null || ix.tx(e.transaccionId).tipo !== 'devolucion') return [];
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
        categoriaId: e.categoriaId,
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
export function consumos(h: HechosDeConsumo, c: Ciclo): Consumo[] {
  const ix = indice(h);
  const neteado = new Map<Uuid, Centavos>();
  for (const d of clasificar(h, c))
    if (d.caso === 'D-1' && d.lineaOriginalId !== null)
      neteado.set(
        d.lineaOriginalId,
        Centavos.sumar(neteado.get(d.lineaOriginalId) ?? Centavos.cero, d.monto),
      );
  const deLineas = h.lineas.flatMap((l): Consumo[] => {
    if (l.categoriaId === null || !TIPOS_DE_CONSUMO.has(ix.tx(l.transaccionId).tipo)) return [];
    const neto = Centavos.restar(l.monto, neteado.get(l.id) ?? Centavos.cero);
    return [
      {
        ...ix.momento(l),
        ...ix.medio(l.transaccionId),
        id: l.id,
        fuente: 'linea',
        categoriaId: l.categoriaId,
        monto: l.monto,
        neto,
      },
    ];
  });
  const deCondonaciones = h.condonaciones.map((x): Consumo => {
    const porCobrar = ix.linea(x.lineaId);
    if (porCobrar === undefined) throw new RangeError(`condonación ${x.id} sin su línea`);
    return {
      fecha: x.fecha,
      claveOrden: x.claveOrden,
      secuencia: x.secuencia,
      orden: 0,
      ...ix.medio(porCobrar.transaccionId),
      id: x.id,
      fuente: 'condonacion',
      categoriaId: x.categoriaId,
      monto: x.monto,
      neto: x.monto,
    };
  });
  return cronologico([...deLineas, ...deCondonaciones]);
}

/**
 * Aportes de las devoluciones D-2 a D-4. En D-3, a = mín(X, U_L − A_L) y r = X − a, con A_L la
 * suma de las partes a de las D-3 anteriores de L, en orden cronológico.
 */
export function aportes(h: HechosDeConsumo, c: Ciclo, noCubierta: NoCubierta): Aporte[] {
  const acumulado = new Map<Uuid, Centavos>();
  return clasificar(h, c).flatMap((d): Aporte[] => {
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
