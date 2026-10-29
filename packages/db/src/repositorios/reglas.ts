// Lectura de `reglas_comercio` [H] (03 §3.22): no entra en la instantánea del motor; las consultas se la pasan a los
// selectores, que son puros (04 §6.0.5).
import type { ReglaComercio, Uuid } from '@finn/dominio';
import { txPrisma, type LectorTx } from '../transacciones.ts';

/** Todas las reglas, en un orden estable (por patrón y id). */
export async function leerReglasComercio(tx: LectorTx): Promise<ReglaComercio[]> {
  const filas = await txPrisma(tx).reglaComercio.findMany({
    orderBy: [{ patron: 'asc' }, { id: 'asc' }],
  });
  return filas.map((f) => ({
    id: f.id as Uuid,
    patron: f.patron,
    categoriaId: f.categoriaId as Uuid,
  }));
}
