// Lecturas de las consultas de programadas y notificaciones (TA-197; 04 §6.12.1, §6.12.5): referencias [H]/[I] a las
// programadas, páginas de `notificaciones` [T] y qué movimientos [H] existen. No entran en la instantánea del motor.
import type { Uuid } from '@finn/dominio';
import { txPrisma, type LectorTx } from '../transacciones.ts';
import { aMovimiento } from './bandeja.ts';

/** Movimientos que esperan una programada y cuántos procesamientos de SMS la referencian (6.12.1, OP-51). */
export async function leerReferenciasDeProgramadas(tx: LectorTx) {
  const p = txPrisma(tx);
  const movimientos = await p.movimiento.findMany({
    where: { esperadaProgramadaId: { not: null } },
    orderBy: { id: 'asc' },
  });
  const cuentas = await p.smsProcesamiento.groupBy({
    by: ['esperadaProgramadaId'],
    where: { esperadaProgramadaId: { not: null } },
    _count: { _all: true },
  });
  return {
    movimientos: movimientos.map(aMovimiento),
    smsPorProgramada: new Map<Uuid, number>(
      cuentas.flatMap((c) =>
        c.esperadaProgramadaId === null ? [] : [[c.esperadaProgramadaId as Uuid, c._count._all]],
      ),
    ),
  };
}

export interface FilaNotificacion {
  readonly id: string;
  readonly creadaEn: Date;
  readonly aviso: string | null;
  readonly motivo: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly datos: unknown;
  readonly leida: boolean;
}

/** Una página de notificaciones, de la más nueva a la más vieja; `cursor` es el id de la última de la página anterior. */
export async function leerPaginaDeNotificaciones(
  tx: LectorTx,
  o: { readonly cursor?: string; readonly soloNoLeidas?: boolean; readonly limite: number },
): Promise<{ readonly filas: FilaNotificacion[]; readonly siguienteCursor?: string }> {
  const filas = await txPrisma(tx).notificacion.findMany({
    where: o.soloNoLeidas === true ? { leidaEn: null } : {},
    orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
    take: o.limite + 1,
    ...(o.cursor === undefined ? {} : { cursor: { id: o.cursor }, skip: 1 }),
  });
  const pagina = filas.slice(0, o.limite).map((f): FilaNotificacion => ({
    id: f.id,
    creadaEn: f.creadaEn,
    aviso: f.aviso,
    motivo: f.motivo,
    titulo: f.titulo,
    cuerpo: f.cuerpo,
    datos: f.datos,
    leida: f.leidaEn !== null,
  }));
  const ultima = pagina[pagina.length - 1];
  return filas.length > o.limite && ultima !== undefined
    ? { filas: pagina, siguienteCursor: ultima.id }
    : { filas: pagina };
}

/** Cuáles de los `ids` son movimientos [H] que todavía existen (`existeDestino`, 03 §7.4). */
export async function movimientosExistentes(
  tx: LectorTx,
  ids: readonly string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const filas = await txPrisma(tx).movimiento.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true },
  });
  return new Set(filas.map((f) => f.id));
}
