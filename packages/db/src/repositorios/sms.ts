// Repositorios de las tablas [I] `sms_recibidos` y `sms_procesamientos` (03 §3.17, §3.18; solo inserción, 4.5.6).
// El texto del SMS solo se guarda aquí (ADR-09); nunca en eventos_sistema ni en la consola (04 §15.3).
import type { Instante, SmsRecibido, Uuid } from '@finn/dominio';
import type { FechaLocal } from '@finn/dominio/valores';
import { ahoraDb, conAhora } from '../ahora.ts';
import { dateDeFechaLocal, instanteDeDate } from '../mapeo/fechas.ts';
import {
  txPrisma,
  txPrismaSinBloqueo,
  type EscritorSmsTx,
  type EscritorTx,
  type LectorTx,
} from '../transacciones.ts';

export type SmsGuardado = { id: string; texto: string; remitente: string; recibidoEn: Date };

/** OP-35 paso 1: con `escribirSms()`, sin el bloqueo global (03 §5.1); `recibido_en` es `finn.ahora()`. */
export async function guardarSms(
  tx: EscritorSmsTx | EscritorTx,
  sms: { texto: string; remitente: string },
): Promise<SmsGuardado> {
  const ahora = await ahoraDb(tx);
  return txPrismaSinBloqueo(tx).smsRecibido.create({
    data: conAhora('smsRecibido', sms, ahora),
  });
}

const VENTANA_AUTODESCARTE_MS = 10 * 60_000; // H12: [t − 10 min, t)
const smsDeDominio = (s: { id: string; texto: string; recibidoEn: Date }): SmsRecibido => ({
  id: s.id as Uuid,
  texto: s.texto,
  recibidoEn: instanteDeDate(s.recibidoEn) as Instante,
});

/**
 * Lo que OP-35 mira del SMS (04 §8.4 a y c): el SMS, los recibidos en los 10 minutos anteriores (autodescarte),
 * cuántos intentos tiene (N-02) y su movimiento, si ya tiene uno. `null` si el SMS no existe.
 */
export async function leerSmsParaProcesar(tx: LectorTx, smsId: string) {
  const p = txPrisma(tx);
  const s = await p.smsRecibido.findUnique({ where: { id: smsId } });
  if (s === null) return null;
  const desde = new Date(s.recibidoEn.getTime() - VENTANA_AUTODESCARTE_MS);
  const anteriores = await p.smsRecibido.findMany({
    where: { recibidoEn: { gte: desde, lt: s.recibidoEn } },
    orderBy: [{ recibidoEn: 'asc' }, { id: 'asc' }],
  });
  const intentos = await p.smsProcesamiento.count({ where: { smsId } });
  const movimiento = await p.movimiento.findUnique({ where: { smsId }, select: { id: true } });
  return {
    sms: smsDeDominio(s),
    anteriores: anteriores.map(smsDeDominio),
    intentos,
    movimientoId: movimiento?.id ?? null,
  };
}

/** 04 §8.6: SMS sin ningún intento y con `recibido_en < finn.ahora() − 2 min`, en orden de llegada. */
export async function smsSinResultado(tx: LectorTx, limite: number): Promise<string[]> {
  const filas = await txPrisma(tx).$queryRaw<{ id: string }[]>`
    SELECT s.id::text AS id FROM finn.sms_recibidos s
    WHERE NOT EXISTS (SELECT 1 FROM finn.sms_procesamientos p WHERE p.sms_id = s.id)
      AND s.recibido_en < finn.ahora() - interval '2 minutes'
    ORDER BY s.recibido_en, s.id
    LIMIT ${limite}`;
  return filas.map((f) => f.id);
}

export function smsPorId(tx: LectorTx, id: string): Promise<SmsGuardado | null> {
  return txPrisma(tx).smsRecibido.findUnique({ where: { id } });
}

/** Un intento de procesamiento (OP-35): `intento` ≥ 1 y único por SMS (N-02). */
export type NuevoProcesamiento = {
  smsId: string;
  intento: number;
  resultado: string;
  formatoId?: string | null;
  formatosCoincidentes?: string[];
  tipoMovimiento?: string | null;
  ultimos4?: string | null;
  monto?: number | null;
  comercio?: string | null;
  fecha?: FechaLocal | null;
  cuentaId?: string | null;
  esperadaProgramadaId?: string | null;
  esperadaFecha?: FechaLocal | null;
  duplicadoTransaccionId?: string | null;
  duplicadoMovimientoId?: string | null;
  categoriaSugeridaId?: string | null;
  errorDetalle?: string | null;
};

const aDate = (f: FechaLocal | null): Date | null => (f === null ? f : dateDeFechaLocal(f));

export async function guardarProcesamiento(tx: EscritorTx, p: NuevoProcesamiento) {
  const { fecha, esperadaFecha, resultado, tipoMovimiento, ...resto } = p;
  const ahora = await ahoraDb(tx);
  const fila = {
    ...resto,
    // Los enums de Prisma son uniones de literales; la base rechaza un valor fuera del tipo
    resultado: resultado as never,
    tipoMovimiento: tipoMovimiento as never,
    ...(fecha !== undefined ? { fecha: aDate(fecha) } : {}),
    ...(esperadaFecha !== undefined ? { esperadaFecha: aDate(esperadaFecha) } : {}),
  };
  return txPrisma(tx).smsProcesamiento.create({ data: conAhora('smsProcesamiento', fila, ahora) });
}

/** El resultado vigente de un SMS: el de su intento con mayor `intento` (03 §3.18). */
export function procesamientoVigente(tx: LectorTx, smsId: string) {
  return txPrisma(tx).smsProcesamiento.findFirst({
    where: { smsId },
    orderBy: { intento: 'desc' },
  });
}

export async function proximoIntento(tx: LectorTx, smsId: string): Promise<number> {
  const v = await txPrisma(tx).smsProcesamiento.aggregate({
    where: { smsId },
    _max: { intento: true },
  });
  return (v._max.intento ?? 0) + 1;
}

export type ContadoresDeBandeja = {
  readonly pendientes: number;
  readonly conCoincidencia: number;
  readonly posiblesDuplicados: number;
  readonly noReconocidos: number;
  readonly errores: number;
};

/** Los contadores de la bandeja (`movimientos` [H], 04 §6.0.2, §6.1): un `count` por estado, con `ix_movimientos_estado`. */
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
