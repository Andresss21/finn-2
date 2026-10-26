// Listo para asignar (01 §4.9; H2, O1, H5, D1, Q3, Q7, B-4) y su descomposición para la pantalla de
// detalle. Las reducciones salen de las celdas de `presupuesto` (§4.6) y el dinero en camino y las
// entradas de cobros, de `porCobrar` (§4.10). `b` y `cobros` deben salir de los mismos hechos, con
// `presupuesto(h, c, hoy, pagosImplicitos(cobros))`.
import type { Hechos, TipoTransaccion } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { type Celda, type Presupuesto, reduccionDe } from './disponible';
import { mutante } from './mutantes';
import type { Periodo } from './periodos';
import {
  dineroEnCamino,
  entradasDeCobros,
  type HechosDePorCobrar,
  type PorCobrar,
  porCobrar,
} from './por-cobrar';

export type HechosDeLpa = HechosDePorCobrar & Pick<Hechos, 'asignaciones'>;

/** Entradas de LPA por clase (§4.13). */
export interface EntradasPorClase {
  /** Ingresos y excedentes de cobros depositados en efectivo. */
  readonly ingreso: Centavos;
  /** Desembolsos, retiros de inversión y avances de efectivo. */
  readonly otras: Centavos;
  /** Restituciones de por cobrar pagados con tarjeta, depositadas en efectivo. */
  readonly restitucion: Centavos;
  /** Saldos iniciales de cuentas de efectivo, con signo. */
  readonly saldoInicial: Centavos;
  readonly total: Centavos;
}

/** Descomposición de LPA para la pantalla de detalle (§4.9). */
export interface DetalleLpa {
  readonly entradas: EntradasPorClase;
  readonly asignadoCerrados: Centavos;
  readonly asignadoActivo: Centavos;
  readonly asignadoFuturos: Centavos;
  /** Σ_{p cerrado} Σ_c SobD(c, p). */
  readonly sobregirosDebito: Centavos;
  /** Σ_{p cerrado} Σ_t E(t, p). */
  readonly pagosExcedentes: Centavos;
  readonly dineroEnCamino: Centavos;
  readonly total: Centavos;
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/** Clase de §4.13 del efecto en una cuenta de efectivo; las demás transacciones no son entradas. */
const CLASE: Partial<Record<TipoTransaccion, 'ingreso' | 'otras' | 'saldoInicial'>> = {
  ingreso: 'ingreso',
  saldo_inicial: 'saldoInicial',
  desembolso_prestamo: 'otras',
  retiro_inversion: 'otras',
  avance_efectivo: 'otras',
};

/**
 * Entradas de §4.9 con fecha ≤ hasta (todas sin `hasta`). No son entradas las entradas a una tarjeta
 * (Q3), los cobros depositados en una tarjeta (Q3, Q7) ni los saldos iniciales de tarjetas,
 * préstamos e inversiones: solo cuentan los efectos en cuentas de efectivo.
 */
export function entradas(
  h: HechosDeLpa,
  cobros: readonly PorCobrar[],
  hasta?: FechaLocal,
): EntradasPorClase {
  const efectivo = new Set(h.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id));
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const vale = (fecha: FechaLocal) => hasta === undefined || fecha <= hasta;
  const por = {
    ingreso: Centavos.cero,
    otras: Centavos.cero,
    restitucion: Centavos.cero,
    saldoInicial: Centavos.cero,
  };
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    const clase = t === undefined ? undefined : CLASE[t.tipo];
    if (t === undefined || clase === undefined || !efectivo.has(e.cuentaId) || !vale(t.fecha))
      continue;
    por[clase] = Centavos.sumar(por[clase], e.monto);
  }
  for (const x of entradasDeCobros(cobros))
    if (vale(x.fecha)) por[x.clase] = Centavos.sumar(por[x.clase], x.monto);
  return { ...por, total: suma(Object.values(por)) };
}

const asignadoSi = (h: HechosDeLpa, cumple: (inicio: FechaLocal) => boolean): Centavos =>
  suma(h.asignaciones.filter((a) => cumple(a.periodoInicio)).map((a) => a.monto));

const reducciones = (celdas: readonly Celda[], clase: Celda['clase']): Centavos =>
  suma(celdas.filter((x) => x.clase === clase).map(reduccionDe));

/**
 * LPA = Entradas − Σ_c Σ_p Asig(c, p) − Σ_{p cerrado} [Σ_c SobD(c, p) + Σ_t E(t, p)] − dinero en
 * camino. Las asignaciones cuentan todas: de pago, archivadas y de períodos futuros.
 */
export function listoParaAsignar(
  h: HechosDeLpa,
  b: Presupuesto,
  cobros: readonly PorCobrar[],
): DetalleLpa {
  const a = b.activo.inicio;
  // Mutante 'cierre' (07 §19.4): el activo reduce LPA como si ya hubiera cerrado.
  const cerradas = b.celdas.filter(
    (x) => x.estado === 'cerrado' || (mutante('cierre') && x.estado === 'activo'),
  );
  const detalle = {
    entradas: entradas(h, cobros),
    asignadoCerrados: asignadoSi(h, (p) => p < a),
    asignadoActivo: asignadoSi(h, (p) => p === a),
    asignadoFuturos: asignadoSi(h, (p) => p > a),
    sobregirosDebito: reducciones(cerradas, 'normal'),
    pagosExcedentes: reducciones(cerradas, 'pago'),
    dineroEnCamino: dineroEnCamino(cobros),
  };
  const restado = suma([
    detalle.asignadoCerrados,
    detalle.asignadoActivo,
    detalle.asignadoFuturos,
    detalle.sobregirosDebito,
    detalle.pagosExcedentes,
    detalle.dineroEnCamino,
  ]);
  return { ...detalle, total: Centavos.restar(detalle.entradas.total, restado) };
}

/**
 * LPA al cierre de p (historial, error 12) [Propio]: Entradas con fecha ≤ fin(p) − Σ_c Σ_{q ≤ p}
 * Asig(c, q) − Σ_{q ≤ p} [Σ_c SobD(c, q) + Σ_t E(t, q)] − dinero en camino al fin(p). Excluye los
 * adelantos a períodos posteriores (B-4). Comprobación: Σ saldos de efectivo al fin(p) = LPA_p +
 * Σ_c Arr(c, p + 1).
 */
export function lpaAlCierre(h: HechosDeLpa, b: Presupuesto, p: Periodo): Centavos {
  const cobros = porCobrar(h, p.fin);
  const hasta = b.celdas.filter((x) => x.periodo.inicio <= p.inicio);
  const restado = suma([
    asignadoSi(h, (q) => q <= p.inicio),
    reducciones(hasta, 'normal'),
    reducciones(hasta, 'pago'),
    dineroEnCamino(cobros),
  ]);
  return Centavos.restar(entradas(h, cobros, p.fin).total, restado);
}
