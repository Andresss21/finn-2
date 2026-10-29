// Lecturas de `movimientos` [H] para las consultas (03 §3.19): los contadores de la bandeja (04 §6.0.2, §6.1).
import { txPrisma, type LectorTx } from '../transacciones.ts';

export type ContadoresDeBandeja = {
  readonly pendientes: number;
  readonly conCoincidencia: number;
  readonly posiblesDuplicados: number;
  readonly noReconocidos: number;
  readonly errores: number;
};

/** Un `count` por estado que pide revisión, con el índice `ix_movimientos_estado`. */
export async function contarBandeja(tx: LectorTx): Promise<ContadoresDeBandeja> {
  const filas = await txPrisma(tx).movimiento.groupBy({ by: ['estado'], _count: { _all: true } });
  const de = (estado: string): number => filas.find((f) => f.estado === estado)?._count._all ?? 0;
  return {
    pendientes: de('pendiente'),
    conCoincidencia: de('con_coincidencia'),
    posiblesDuplicados: de('posible_duplicado'),
    noReconocidos: de('no_reconocido'),
    errores: de('error'),
  };
}
