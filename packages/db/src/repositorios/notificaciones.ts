// Repositorio de `notificaciones` [T] (03 §3.28; retención de 180 días, 04 §15.1). El cuerpo es el contenido
// mínimo (ADR-12) y `datos` solo lleva referencias, sin claves foráneas (7.4).
import { ahoraDb, conAhora } from '../ahora.ts';
import { txPrisma, type EscritorTx, type LectorTx } from '../transacciones.ts';

export type NuevaNotificacion = {
  aviso: string;
  motivo: string;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, string | number | boolean | null>;
};

export async function crearNotificacion(tx: EscritorTx, n: NuevaNotificacion) {
  const ahora = await ahoraDb(tx);
  return txPrisma(tx).notificacion.create({ data: conAhora('notificacion', n, ahora) });
}

export function notificacionesRecientes(tx: LectorTx, limite = 50) {
  return txPrisma(tx).notificacion.findMany({ orderBy: { creadaEn: 'desc' }, take: limite });
}

export async function marcarLeida(tx: EscritorTx, id: string): Promise<void> {
  await txPrisma(tx).notificacion.update({ where: { id }, data: { leidaEn: await ahoraDb(tx) } });
}

/** Resultado del envío push: `error` en texto sin datos del usuario, o el instante del envío correcto. */
export async function registrarPush(
  tx: EscritorTx,
  id: string,
  resultado: { error: string } | 'enviada',
): Promise<void> {
  const data =
    resultado === 'enviada'
      ? { pushEnviadaEn: await ahoraDb(tx), pushError: null }
      : { pushError: resultado.error };
  await txPrisma(tx).notificacion.update({ where: { id }, data });
}

/** Retención: borra lo anterior a `antesDe` y devuelve cuántas filas. */
export async function purgarNotificaciones(tx: EscritorTx, antesDe: Date): Promise<number> {
  const r = await txPrisma(tx).notificacion.deleteMany({ where: { creadaEn: { lt: antesDe } } });
  return r.count;
}
