// Lo que OP-42 y OP-51 necesitan de `movimientos` y `sms_procesamientos` (fuera de los hechos del motor; BE-10, 04 §3.7).
import type { Uuid } from '@finn/dominio';
import { txPrisma, type LectorTx } from '../transacciones.ts';

/** Movimientos en `con_coincidencia` que proponen una ocurrencia de la programada (`calendario_con_historial`, HZ-3). */
export const contarCoincidenciasDeProgramada = (
  tx: LectorTx,
  programadaId: Uuid,
): Promise<number> =>
  txPrisma(tx).movimiento.count({
    where: { esperadaProgramadaId: programadaId, estado: 'con_coincidencia' },
  });

/** Filas de `movimientos` y `sms_procesamientos` que la apuntan: con alguna, no se elimina (`programada_con_historial`). */
export async function contarReferenciasDeProgramada(
  tx: LectorTx,
  programadaId: Uuid,
): Promise<number> {
  const p = txPrisma(tx);
  const donde = { esperadaProgramadaId: programadaId };
  const movimientos = await p.movimiento.count({ where: donde });
  return movimientos + (await p.smsProcesamiento.count({ where: donde }));
}
