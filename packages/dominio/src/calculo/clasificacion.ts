// Clasificación para reportes (01 §4.13; N9, Q3, Q7, H13, D1, O1, H6): gasto por categoría, neto de
// devoluciones; cobros, de `porCobrar` (§4.10). Fuera de §4.13 quedan sin clase el ajuste de valor
// de una inversión (OP-25, sin efecto presupuestario) y las devoluciones a un por cobrar.
import type { TipoTransaccion, Transaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { type HechosDeConsumo, movimientos, porId } from './devoluciones';
import type { Ciclo } from './periodos';
import type { PorCobrar } from './por-cobrar';

export type ClaseDeReporte =
  'ingreso' | 'otras_entradas' | 'restitucion' | 'saldo_inicial' | 'gasto' | 'neutral';

/** Monto ≥ 0, salvo el saldo inicial (signo de su cuenta) y una devolución (resta del gasto). */
export interface Partida {
  /** La transacción, la línea o la condonación que la origina. */
  readonly id: Uuid;
  readonly fecha: FechaLocal;
  readonly clase: ClaseDeReporte;
  /** La categoría del gasto; `null` en las demás clases. */
  readonly categoriaId: Uuid | null;
  readonly monto: Centavos;
}

/** Interés y seguro de una cuota (H6): detalle informativo, ya incluido en el gasto de la cuota. */
export interface CostoFinanciero {
  readonly transaccionId: Uuid;
  readonly fecha: FechaLocal;
  readonly prestamoId: Uuid;
  readonly categoriaId: Uuid | null;
  readonly interes: Centavos;
  readonly seguro: Centavos;
}

export interface Clasificacion {
  readonly partidas: readonly Partida[];
  readonly costosFinancieros: readonly CostoFinanciero[];
}

/** Clase por tipo de transacción, por su total; los consumos y los cobros van aparte. */
const POR_TOTAL: Partial<Record<TipoTransaccion, ClaseDeReporte>> = {
  ingreso: 'ingreso',
  entrada_tarjeta: 'ingreso',
  desembolso_prestamo: 'otras_entradas',
  retiro_inversion: 'otras_entradas',
  avance_efectivo: 'otras_entradas',
  pago_tarjeta: 'neutral',
  transferencia: 'neutral',
  transferencia_tarjetas: 'neutral',
};

type Origen = Pick<Partida, 'id' | 'fecha'>;

/** Las partidas de §4.13 de todos los hechos. `cobros` debe salir de los mismos hechos. */
export function clasificacion(
  h: HechosDeConsumo,
  c: Ciclo,
  cobros: readonly PorCobrar[],
  m = movimientos(h, c),
  txs: ReadonlyMap<Uuid, Transaccion> = porId(h.transacciones),
): Clasificacion {
  const partidas: Partida[] = [];
  const agregar = (x: Origen, clase: ClaseDeReporte, monto: Centavos, cat: Uuid | null = null) =>
    partidas.push({ id: x.id, fecha: x.fecha, clase, categoriaId: cat, monto });

  for (const t of h.transacciones) {
    const clase = POR_TOTAL[t.tipo];
    if (clase !== undefined) agregar(t, clase, t.total);
  }
  // El saldo inicial, con el signo de su cuenta: el efecto de la transacción.
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    if (t?.tipo === 'saldo_inicial') agregar(t, 'saldo_inicial', e.monto);
  }
  // Restitución y excedente de cada cobro, en cualquier medio y cuenta [D1, O1, N9].
  for (const e of cobros.flatMap((x) => x.eventos.filter((y) => y.tipo === 'cobro'))) {
    if (e.restituido > 0) agregar(e, 'restitucion', e.restituido);
    if (e.excedente > 0) agregar(e, 'ingreso', e.excedente);
  }
  // Consumos netos de las devoluciones D-1 y, en negativo, las demás devoluciones a categoría.
  for (const k of m.consumos) agregar(k, 'gasto', k.neto, k.categoriaId);
  for (const d of m.devoluciones)
    if (d.caso !== 'D-1')
      agregar({ id: d.lineaId, fecha: d.fecha }, 'gasto', Centavos.negar(d.monto), d.categoriaId);

  // La categoría de la cuota es la de su línea (OP-24 registra una sola).
  const costosFinancieros: CostoFinanciero[] = [];
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    if (t?.tipo !== 'cuota_prestamo' || (e.interes === null && e.seguro === null)) continue;
    costosFinancieros.push({
      transaccionId: t.id,
      fecha: t.fecha,
      prestamoId: e.cuentaId,
      categoriaId: h.lineas.find((l) => l.transaccionId === t.id)?.categoriaId ?? null,
      interes: e.interes ?? Centavos.cero,
      seguro: e.seguro ?? Centavos.cero,
    });
  }
  return { partidas, costosFinancieros };
}
