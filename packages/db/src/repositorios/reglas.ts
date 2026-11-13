// Lectura de `reglas_comercio` [H] (03 §3.22): no entra en la instantánea del motor; las consultas se la pasan a los
// selectores, que son puros (04 §6.0.5).
import type { MovimientoLinea, ReglaComercio, Uuid } from '@finn/dominio';
import { Centavos } from '@finn/dominio/valores';
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

/**
 * [CH-254] «Usada N veces» (04 §6.12.2): cuántos movimientos categorizó cada regla (`movimientos.regla_id`, 03 §3.19).
 * Solo los de después de m_datos_entrega_4; una regla sin movimientos no aparece.
 */
export async function contarUsosDeReglas(tx: LectorTx): Promise<ReadonlyMap<Uuid, number>> {
  const filas = await txPrisma(tx).movimiento.groupBy({
    by: ['reglaId'],
    where: { reglaId: { not: null } },
    _count: { _all: true },
  });
  return new Map(filas.map((f) => [f.reglaId as Uuid, f._count._all]));
}

/** Las líneas de movimientos bancarios [H] que apuntan a `categoriaId`: OP-12 las pasa a la categoría destino. */
export async function leerMovimientoLineasDeCategoria(
  tx: LectorTx,
  categoriaId: Uuid,
): Promise<MovimientoLinea[]> {
  const filas = await txPrisma(tx).movimientoLinea.findMany({
    where: { categoriaId },
    orderBy: { id: 'asc' },
  });
  return filas.map((f) => ({
    id: f.id as Uuid,
    movimientoId: f.movimientoId as Uuid,
    orden: f.orden,
    monto: Centavos.desdeEntero(f.monto),
    categoriaId: f.categoriaId as Uuid | null,
    deudorId: f.deudorId as Uuid | null,
    lineaOriginalId: f.lineaOriginalId as Uuid | null,
  }));
}
