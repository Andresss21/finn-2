// `seleccionar.clasificarConciliacion` (BE-48; 01 §4.17, supuesto 10; 04 §9.5): coincidencias 1 a 1
// con el criterio de `criterios/conciliacion.ts`, solo en el estado, solo en Finn, el saldo de Finn a
// la fecha del estado y la diferencia propuesta. OP-46 y OP-47 la repiten con los hechos del momento.
import { saldoAl } from '../calculo/saldos';
import {
  type Candidata,
  coincidenciasDeConciliacion,
  type Partida,
} from '../criterios/conciliacion';
import type {
  EstadoDeCuenta,
  Hechos,
  Instantanea,
  MovimientoDelEstado,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';

export interface Clasificacion {
  readonly coincidencias: readonly {
    readonly transaccionId: Uuid;
    readonly movimientoIndice: number;
  }[];
  readonly soloEnEstado: readonly number[]; // índices de los movimientos sin pareja
  readonly soloEnFinn: readonly Uuid[]; // candidatas sin pareja
  readonly saldoFinn: Centavos; // saldo(cuenta, fechaEstado)
  readonly diferencia: Centavos; // saldo final del estado − saldo de Finn (ESC-47)
}

/** Orden de las candidatas: clave de orden y después secuencia (sin secuencia, al final) e id. */
const orden = (t: Transaccion) =>
  `${t.claveOrden}|${t.secuencia === null ? '~' : t.secuencia.padStart(20, '0')}|${t.id}`;

/** Transacciones no conciliadas con efecto en la cuenta y fecha en [desde, hasta], en `orden`. */
export function candidatasDeConciliacion(
  h: Hechos,
  cuentaId: Uuid,
  hasta: FechaLocal,
  desde?: FechaLocal,
): Candidata[] {
  const efecto = new Map(
    h.efectos.filter((e) => e.cuentaId === cuentaId).map((e) => [e.transaccionId, e.monto]),
  );
  return h.transacciones
    .filter((t) => t.estadoBancario !== 'conciliada' && efecto.has(t.id) && t.fecha <= hasta)
    .filter((t) => desde === undefined || t.fecha >= desde)
    .sort((a, b) => (orden(a) < orden(b) ? -1 : 1))
    .map((t) => {
      const monto = efecto.get(t.id) as Centavos;
      return { id: t.id, cuentaId, fecha: t.fecha, monto, claveOrden: t.claveOrden };
    });
}

/** El movimiento como partida del criterio; su id es el índice. */
export const partidaDe = (cuentaId: Uuid, m: MovimientoDelEstado): Partida => ({
  id: String(m.indice),
  cuentaId,
  fecha: m.fecha,
  monto: m.monto,
});

/** Las candidatas del estado (04 §9.5): fecha en [primera fecha del estado − 3 días, fechaEstado]. */
export function candidatasDelEstado(h: Hechos, cuentaId: Uuid, estado: EstadoDeCuenta) {
  const fechas = estado.movimientos.map((m) => m.fecha);
  const primera = fechas.reduce((a, x) => (x < a ? x : a), estado.fechaEstado);
  return candidatasDeConciliacion(
    h,
    cuentaId,
    estado.fechaEstado,
    FechaLocal.sumarDias(primera, -3),
  );
}

export function clasificarConciliacion(
  i: Instantanea,
  cuentaId: Uuid,
  estado: EstadoDeCuenta,
): Clasificacion {
  const candidatas = candidatasDelEstado(i.hechos, cuentaId, estado);
  const partidas = estado.movimientos.map((m) => partidaDe(cuentaId, m));
  const pares = coincidenciasDeConciliacion(partidas, candidatas);
  const usadas = new Set(pares.values());
  const saldoFinn = saldoAl(i.hechos, cuentaId, estado.fechaEstado);
  return {
    coincidencias: estado.movimientos.flatMap((m) => {
      const t = pares.get(String(m.indice)) as Uuid | undefined;
      return t === undefined ? [] : [{ transaccionId: t, movimientoIndice: m.indice }];
    }),
    soloEnEstado: estado.movimientos
      .filter((m) => !pares.has(String(m.indice)))
      .map((m) => m.indice),
    soloEnFinn: candidatas.filter((c) => !usadas.has(c.id)).map((c) => c.id as Uuid),
    saldoFinn,
    diferencia: Centavos.restar(estado.saldoFinal, saldoFinn),
  };
}

/** Lo que OP-53 propone al previsualizar (04 §3.8 [CH-36]): el saldo de Finn, la diferencia y cuántas marcaría. */
export type PropuestaDeVerificacion = {
  readonly saldoFinn: Centavos;
  readonly diferencia: Centavos;
  readonly marcaria: number;
};

/**
 * `saldoFinn` = saldo(cuenta, fechaEstado) y `diferencia` = saldo del banco − `saldoFinn`, ambos en la convención de
 * 01 §0.4 (en una tarjeta la deuda es negativa; el usuario la escribe en positivo). `undefined` si la cuenta no es de
 * efectivo ni tarjeta: el rechazo lo da `aplicar`.
 */
export function propuestaDeVerificacion(
  h: Hechos,
  x: {
    readonly cuentaId: Uuid;
    readonly fechaEstado: FechaLocal;
    readonly saldoEstado: Centavos;
    readonly marcar: { readonly todas: true } | { readonly ids: readonly Uuid[] };
  },
): PropuestaDeVerificacion | undefined {
  const k = h.cuentas.find((c) => c.id === x.cuentaId);
  if (k === undefined || (k.tipo !== 'efectivo' && k.tipo !== 'tarjeta')) return undefined;
  const saldoFinn = saldoAl(h, k.id, x.fechaEstado);
  const banco = k.tipo === 'tarjeta' ? Centavos.negar(x.saldoEstado) : x.saldoEstado;
  const marcaria =
    'todas' in x.marcar
      ? candidatasDeConciliacion(h, k.id, x.fechaEstado).length
      : new Set(x.marcar.ids).size;
  return { saldoFinn, diferencia: Centavos.restar(banco, saldoFinn), marcaria };
}
