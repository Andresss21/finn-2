// Clasificación para reportes (01 §4.13; N9, Q3, Q7, H13, D1, O1, H6). Cada movimiento queda en una
// clase con su monto; el gasto va por categoría y neto de devoluciones. Los cobros salen de
// `porCobrar` (§4.10), que separa la restitución del excedente. El ajuste de inversión no figura en
// la tabla de §4.13 y no se clasifica; tampoco las devoluciones a un por cobrar (§4.10).
import type { TipoTransaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { clasificar, consumos, type HechosDeConsumo } from './devoluciones';
import type { Ciclo } from './periodos';
import type { PorCobrar } from './por-cobrar';

export type ClaseDeReporte =
  'ingreso' | 'otras_entradas' | 'restitucion' | 'saldo_inicial' | 'gasto' | 'neutral';

export interface Partida {
  /** La transacción, la línea o la condonación que la origina. */
  readonly id: Uuid;
  /** `null` en una condonación. */
  readonly transaccionId: Uuid | null;
  readonly fecha: FechaLocal;
  readonly clase: ClaseDeReporte;
  /** La categoría del gasto; `null` en las demás clases. */
  readonly categoriaId: Uuid | null;
  /**
   * Monto ≥ 0, salvo el saldo inicial (con el signo de su cuenta) y la devolución, que resta del
   * gasto de su categoría.
   */
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

/** Las partidas de §4.13 de todos los hechos. `cobros` debe salir de los mismos hechos. */
export function clasificacion(
  h: HechosDeConsumo,
  c: Ciclo,
  cobros: readonly PorCobrar[],
): Clasificacion {
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const deLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const partidas: Partida[] = [];
  const agregar = (
    id: Uuid,
    transaccionId: Uuid | null,
    fecha: FechaLocal,
    clase: ClaseDeReporte,
    monto: Centavos,
    categoriaId: Uuid | null = null,
  ) => partidas.push({ id, transaccionId, fecha, clase, categoriaId, monto });

  for (const t of h.transacciones) {
    const clase = POR_TOTAL[t.tipo];
    if (clase !== undefined) agregar(t.id, t.id, t.fecha, clase, t.total);
    if (t.tipo === 'saldo_inicial') {
      const efecto = h.efectos.filter((e) => e.transaccionId === t.id).map((e) => e.monto);
      agregar(t.id, t.id, t.fecha, 'saldo_inicial', efecto.reduce(Centavos.sumar, Centavos.cero));
    }
  }
  // Restitución y excedente de cada cobro, en cualquier medio y cuenta [D1, O1, N9].
  for (const x of cobros)
    for (const e of x.eventos) {
      if (e.tipo !== 'cobro') continue;
      if (e.restituido > 0) agregar(e.id, e.id, e.fecha, 'restitucion', e.restituido);
      if (e.excedente > 0) agregar(e.id, e.id, e.fecha, 'ingreso', e.excedente);
    }
  // Consumos netos de las devoluciones D-1 y, en negativo, las demás devoluciones a categoría.
  for (const k of consumos(h, c)) {
    const transaccionId = k.fuente === 'linea' ? (deLinea.get(k.id) ?? null) : null;
    agregar(k.id, transaccionId, k.fecha, 'gasto', k.neto, k.categoriaId);
  }
  for (const d of clasificar(h, c)) {
    if (d.caso === 'D-1') continue;
    agregar(
      d.lineaId,
      deLinea.get(d.lineaId) ?? null,
      d.fecha,
      'gasto',
      Centavos.negar(d.monto),
      d.categoriaId,
    );
  }

  const costosFinancieros = h.efectos.flatMap((e): CostoFinanciero[] => {
    const t = txs.get(e.transaccionId);
    if (t?.tipo !== 'cuota_prestamo' || (e.interes === null && e.seguro === null)) return [];
    const [primera] = h.lineas
      .filter((l) => l.transaccionId === t.id)
      .sort((a, b) => a.orden - b.orden);
    return [
      {
        transaccionId: t.id,
        fecha: t.fecha,
        prestamoId: e.cuentaId,
        categoriaId: primera?.categoriaId ?? null,
        interes: e.interes ?? Centavos.cero,
        seguro: e.seguro ?? Centavos.cero,
      },
    ];
  });
  return { partidas, costosFinancieros };
}
