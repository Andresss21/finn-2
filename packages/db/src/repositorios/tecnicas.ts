// Repositorios de las filas únicas, las suscripciones y la lectura de `eliminaciones` [T] (03 §3.28): `estado_respaldo`, `token_webhook`
// (id = 1) y `suscripciones_push` (única por `endpoint`). El token nunca se guarda en claro: solo su SHA-256.
import { ahoraDb, conAhora } from '../ahora.ts';
import { txPrisma, type EscritorTx, type LectorTx } from '../transacciones.ts';

export function leerEstadoRespaldo(tx: LectorTx) {
  return txPrisma(tx).estadoRespaldo.findUnique({ where: { id: 1 } });
}

export async function registrarRespaldo(tx: EscritorTx, objeto: string): Promise<void> {
  const ultimoRespaldoEn = await ahoraDb(tx);
  await txPrisma(tx).estadoRespaldo.upsert({
    where: { id: 1 },
    create: { id: 1, ultimoRespaldoEn, ultimoRespaldoObjeto: objeto },
    update: { ultimoRespaldoEn, ultimoRespaldoObjeto: objeto },
  });
}

export async function registrarRestauracion(tx: EscritorTx): Promise<void> {
  const ultimaRestauracionEn = await ahoraDb(tx);
  await txPrisma(tx).estadoRespaldo.upsert({
    where: { id: 1 },
    create: { id: 1, ultimaRestauracionEn },
    update: { ultimaRestauracionEn },
  });
}

/** El hash SHA-256 (64 hexadecimales) del token de MacroDroid, o `null` si aún no hay (ADR-08). */
export async function leerHashToken(tx: LectorTx): Promise<string | null> {
  const f = await txPrisma(tx).tokenWebhook.findUnique({ where: { id: 1 } });
  return f?.hashSha256 ?? null;
}

/** Alta o rotación del token: `creado_en` es la última rotación. */
export async function guardarHashToken(tx: EscritorTx, hashSha256: string): Promise<void> {
  const creadoEn = await ahoraDb(tx);
  await txPrisma(tx).tokenWebhook.upsert({
    where: { id: 1 },
    create: conAhora('tokenWebhook', { id: 1, hashSha256 }, creadoEn),
    update: { hashSha256, creadoEn },
  });
}

export type NuevaSuscripcion = {
  endpoint: string;
  claveP256dh: string;
  claveAuth: string;
  agente?: string | null;
};

/** Alta, o renovación si el `endpoint` ya existe (se abre la app, 03 §3.28). */
export async function guardarSuscripcion(tx: EscritorTx, s: NuevaSuscripcion): Promise<void> {
  const ahora = await ahoraDb(tx);
  const datos = { claveP256dh: s.claveP256dh, claveAuth: s.claveAuth, agente: s.agente ?? null };
  await txPrisma(tx).suscripcionPush.upsert({
    where: { endpoint: s.endpoint },
    create: conAhora('suscripcionPush', { endpoint: s.endpoint, ...datos }, ahora),
    update: { ...datos, renovadaEn: ahora },
  });
}

export function listarSuscripciones(tx: LectorTx) {
  return txPrisma(tx).suscripcionPush.findMany({ orderBy: { creadaEn: 'asc' } });
}

export async function eliminarSuscripcion(tx: EscritorTx, endpoint: string): Promise<number> {
  const r = await txPrisma(tx).suscripcionPush.deleteMany({ where: { endpoint } });
  return r.count;
}

/** ¿`eliminaciones` registra esta fila? Es la prueba de una eliminación ya hecha (04 §4.6.3; 30 días, 03 §5.3). */
export async function fueEliminada(tx: LectorTx, tabla: string, filaId: string): Promise<boolean> {
  const f = await txPrisma(tx).eliminacion.findFirst({
    where: { tabla, filaId },
    select: { id: true },
  });
  return f !== null;
}
