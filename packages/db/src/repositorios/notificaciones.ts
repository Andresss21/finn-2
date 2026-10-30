// Repositorio de `notificaciones` [T] (03 §3.28; retención de 180 días, 04 §15.1). El cuerpo es el contenido
// mínimo (ADR-12) y `datos` solo lleva referencias, sin claves foráneas (7.4).
import { ahoraDb, conAhora } from '../ahora.ts';
import { txPrisma, txPrismaT, type EscritorTablasT, type LectorTx } from '../transacciones.ts';

export type ValorDatoNotificacion =
  string | number | boolean | null | readonly ValorDatoNotificacion[] | DatosNotificacion;
export type DatosNotificacion = { readonly [clave: string]: ValorDatoNotificacion };

export type NuevaNotificacion = {
  /** Nulo para los motivos que no son un aviso del dominio (CF-16, 03 §3.28). */
  aviso: string | null;
  motivo: string;
  titulo: string;
  cuerpo: string;
  datos?: DatosNotificacion;
};

export async function crearNotificacion(tx: EscritorTablasT, n: NuevaNotificacion) {
  const ahora = await ahoraDb(tx);
  return txPrismaT(tx).notificacion.create({ data: conAhora('notificacion', n, ahora) });
}

export function notificacionesRecientes(tx: LectorTx, limite = 50) {
  return txPrisma(tx).notificacion.findMany({ orderBy: { creadaEn: 'desc' }, take: limite });
}

/** Cuántas notificaciones no leídas hay (`notificacionesNoLeidas` del encabezado, 04 §6.0.2). */
export function contarNoLeidas(tx: LectorTx): Promise<number> {
  return txPrisma(tx).notificacion.count({ where: { leidaEn: null } });
}

/** Las no leídas de un aviso, de la más nueva a la más vieja (AV-01 en Inicio, BE-38). */
export async function noLeidasDeAviso(tx: LectorTx, aviso: string, limite = 50) {
  return txPrisma(tx).notificacion.findMany({
    where: { aviso, leidaEn: null },
    orderBy: { creadaEn: 'desc' },
    take: limite,
  });
}

/** 04 §11.3: las `sms_*` creadas en los últimos 5 minutos de `finn.ahora()`. */
export async function contarSmsRecientes(tx: LectorTx): Promise<number> {
  const desde = new Date((await ahoraDb(tx)).getTime() - 5 * 60_000);
  return txPrisma(tx).notificacion.count({
    where: { motivo: { startsWith: 'sms_' }, creadaEn: { gte: desde } },
  });
}

/** Marca como leídas las no leídas de `ids`, o todas; las ya leídas conservan su `leida_en` (natural). Devuelve cuántas. */
export async function marcarLeidas(
  tx: EscritorTablasT,
  quien: { readonly ids: readonly string[] } | { readonly todas: true },
): Promise<number> {
  const r = await txPrismaT(tx).notificacion.updateMany({
    where: { leidaEn: null, ...('ids' in quien ? { id: { in: [...quien.ids] } } : {}) },
    data: { leidaEn: await ahoraDb(tx) },
  });
  return r.count;
}

export async function marcarLeida(tx: EscritorTablasT, id: string): Promise<void> {
  await txPrismaT(tx).notificacion.update({ where: { id }, data: { leidaEn: await ahoraDb(tx) } });
}

/** Resultado del envío push: `error` en texto sin datos del usuario, o el instante del envío correcto. */
export async function registrarPush(
  tx: EscritorTablasT,
  id: string,
  resultado: { error: string } | 'enviada',
): Promise<void> {
  const data =
    resultado === 'enviada'
      ? { pushEnviadaEn: await ahoraDb(tx), pushError: null }
      : { pushError: resultado.error };
  await txPrismaT(tx).notificacion.update({ where: { id }, data });
}

/** Retención: borra lo anterior a `antesDe` y devuelve cuántas filas. */
export async function purgarNotificaciones(tx: EscritorTablasT, antesDe: Date): Promise<number> {
  const r = await txPrismaT(tx).notificacion.deleteMany({ where: { creadaEn: { lt: antesDe } } });
  return r.count;
}
