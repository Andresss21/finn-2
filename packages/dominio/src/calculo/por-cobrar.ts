// Por cobrar, cobros y pago implícito (01 §4.10; D1, I4, I5, N9, O1, P9, Q3, Q7; inv. 9). Una línea
// por cobrar es una línea de gasto con deudor (03 §4.5.2). Sus eventos son los cobros (transacción
// `cobro` con `lineaCobradaId`, DB-05), las condonaciones y las líneas de devolución que la tienen
// como `lineaOriginalId`. La condonación como consumo ya la da `consumos()` (§4.4): aquí solo baja
// el saldo abierto. Los pagos implícitos entran a `presupuesto(…, pagosImplicitos)` (§4.6).
import type { Hechos, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { cronologico, type Medio, mediosDe, type Momento, porId } from './devoluciones';
import type { PagoImplicito } from './disponible';

export type HechosDePorCobrar = Pick<
  Hechos,
  'cuentas' | 'transacciones' | 'efectos' | 'lineas' | 'condonaciones'
>;

/** Un evento de la línea, con el saldo abierto que deja. */
export interface EventoDePorCobrar extends Momento {
  /** La transacción del cobro, la condonación o la línea de devolución. */
  readonly id: Uuid;
  readonly tipo: 'cobro' | 'condonacion' | 'devolucion';
  /** C, K o X. */
  readonly monto: Centavos;
  /** La cuenta del cobro o de la devolución; `null` en una condonación. */
  readonly cuenta: Medio | null;
  /** R_e = mín(C, abierto) en un cobro; 0 en los demás. */
  readonly restituido: Centavos;
  /** Exc_e = C − R_e en un cobro; 0 en los demás. */
  readonly excedente: Centavos;
  readonly abierto: Centavos;
}

export interface PorCobrar {
  readonly lineaId: Uuid;
  readonly deudorId: Uuid;
  readonly fecha: FechaLocal;
  /** M. */
  readonly monto: Centavos;
  /** El medio de pago de la compra: `tarjetaId` es `null` si fue con débito o efectivo. */
  readonly medio: Medio;
  readonly eventos: readonly EventoDePorCobrar[];
  readonly abierto: Centavos;
  readonly restituido: Centavos;
  readonly condonado: Centavos;
  readonly devuelto: Centavos;
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
type Pendiente = Omit<EventoDePorCobrar, 'restituido' | 'excedente' | 'abierto'>;
const momento = (x: Omit<Momento, 'orden'>, orden: number): Momento => ({
  fecha: x.fecha,
  claveOrden: x.claveOrden,
  secuencia: x.secuencia,
  orden,
});

/** `medio(id)` con los medios de `mediosDe`: falla si la transacción no tiene uno. */
function buscador(m: ReadonlyMap<Uuid, Medio>) {
  return (transaccionId: Uuid): Medio => {
    const x = m.get(transaccionId);
    if (x === undefined)
      throw new RangeError(`transacción ${transaccionId} sin cuenta de efectivo o tarjeta`);
    return x;
  };
}

/**
 * Las líneas por cobrar con su recorrido de §4.10, en orden cronológico de eventos. Con `hasta`,
 * solo las líneas y los eventos con fecha ≤ hasta (dinero en camino al fin(p), §4.9).
 * Una condonación o devolución que supera el saldo abierto en su momento rompe inv. 9: se rechaza.
 */
export function porCobrar(
  h: HechosDePorCobrar,
  hasta?: FechaLocal,
  txs: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
  medios: ReadonlyMap<Uuid, Medio> = mediosDe(h),
): PorCobrar[] {
  const medio = buscador(medios);
  const vale = (fecha: FechaLocal) => hasta === undefined || fecha <= hasta;
  const pendientes = new Map<Uuid, Pendiente[]>();
  const agregar = (lineaId: Uuid, e: Pendiente) => {
    if (vale(e.fecha)) pendientes.set(lineaId, [...(pendientes.get(lineaId) ?? []), e]);
  };
  for (const t of h.transacciones)
    if (t.tipo === 'cobro' && t.lineaCobradaId !== null)
      agregar(t.lineaCobradaId, {
        ...momento(t, 0),
        id: t.id,
        tipo: 'cobro',
        monto: t.total,
        cuenta: medio(t.id),
      });
  for (const x of h.condonaciones)
    agregar(x.lineaId, {
      ...momento(x, 0),
      id: x.id,
      tipo: 'condonacion',
      monto: x.monto,
      cuenta: null,
    });
  for (const l of h.lineas) {
    if (l.lineaOriginalId === null) continue;
    const t = txs.get(l.transaccionId);
    if (t?.tipo === 'devolucion')
      agregar(l.lineaOriginalId, {
        ...momento(t, l.orden),
        id: l.id,
        tipo: 'devolucion',
        monto: l.monto,
        cuenta: medio(t.id),
      });
  }

  return h.lineas.flatMap((l): PorCobrar[] => {
    if (l.deudorId === null) return [];
    const t = txs.get(l.transaccionId);
    if (t?.tipo !== 'gasto' || !vale(t.fecha)) return [];
    let abierto = l.monto;
    const eventos = cronologico(pendientes.get(l.id) ?? []).map((e): EventoDePorCobrar => {
      let restituido = Centavos.cero;
      let excedente = Centavos.cero;
      if (e.tipo === 'cobro') {
        restituido = Centavos.min(e.monto, abierto);
        excedente = Centavos.restar(e.monto, restituido);
      } else if (e.monto > abierto)
        throw new RangeError(`${e.tipo} ${e.id} supera el saldo abierto de ${l.id} (inv. 9)`);
      abierto = Centavos.restar(abierto, e.tipo === 'cobro' ? restituido : e.monto);
      return { ...e, restituido, excedente, abierto };
    });
    const de = (tipo: EventoDePorCobrar['tipo']) =>
      suma(eventos.filter((e) => e.tipo === tipo).map((e) => e.monto));
    return [
      {
        lineaId: l.id,
        deudorId: l.deudorId,
        fecha: t.fecha,
        monto: l.monto,
        medio: medio(t.id),
        eventos,
        abierto,
        restituido: suma(eventos.map((e) => e.restituido)),
        condonado: de('condonacion'),
        devuelto: de('devolucion'),
      },
    ];
  });
}

/** Dinero en camino: Σ abierto de las líneas cuya compra fue con débito o efectivo [D1]. */
export const dineroEnCamino = (xs: readonly PorCobrar[]): Centavos =>
  suma(xs.filter((x) => x.medio.tarjetaId === null).map((x) => x.abierto));

/** Por cobrar en el patrimonio neto: Σ abierto de todas las líneas [P9]. */
export const porCobrarAbierto = (xs: readonly PorCobrar[]): Centavos =>
  suma(xs.map((x) => x.abierto));

/**
 * Pagos implícitos (§4.10, Q7): el R de cada cobro de un por cobrar con débito depositado en una
 * tarjeta u, que baja Disp(pago(u)) en el período del cobro. Es el parámetro `pagosImplicitos` de
 * `presupuesto`. Un cobro con tarjeta en una tarjeta solo reduce la deuda (Q3): no da pago implícito.
 */
export const pagosImplicitos = (xs: readonly PorCobrar[]): PagoImplicito[] =>
  xs.flatMap((x) =>
    x.medio.tarjetaId !== null
      ? []
      : x.eventos.flatMap((e) =>
          e.cuenta === null || e.cuenta.tarjetaId === null || e.restituido <= 0
            ? []
            : [{ tarjetaId: e.cuenta.tarjetaId, fecha: e.fecha, monto: e.restituido }],
        ),
  );

/** Entrada a LPA de un cobro depositado en una cuenta de efectivo (§4.9, §4.13). */
export interface EntradaDeCobro {
  readonly fecha: FechaLocal;
  readonly clase: 'ingreso' | 'restitucion';
  readonly monto: Centavos;
}

/**
 * Entradas de LPA que dan los cobros en efectivo: el excedente es ingreso en los dos medios
 * [N9]; R es restitución solo si la compra fue con tarjeta [O1] (con débito, R entra porque baja el
 * dinero en camino). Los cobros depositados en una tarjeta no son entradas (Q3, Q7).
 */
export const entradasDeCobros = (xs: readonly PorCobrar[]): EntradaDeCobro[] =>
  xs.flatMap((x) =>
    x.eventos.flatMap((e): EntradaDeCobro[] => {
      if (e.tipo !== 'cobro' || e.cuenta === null || e.cuenta.tarjetaId !== null) return [];
      const r: EntradaDeCobro[] = [];
      if (e.excedente > 0) r.push({ fecha: e.fecha, clase: 'ingreso', monto: e.excedente });
      if (x.medio.tarjetaId !== null && e.restituido > 0)
        r.push({ fecha: e.fecha, clase: 'restitucion', monto: e.restituido });
      return r;
    }),
  );
