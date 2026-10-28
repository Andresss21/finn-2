// Repositorios de las tablas [I] `sms_recibidos` y `sms_procesamientos` (03 §3.17, §3.18; solo inserción, 4.5.6).
// El texto del SMS solo se guarda aquí (ADR-09); nunca en eventos_sistema ni en la consola (04 §15.3).
import type { FechaLocal } from '@finn/dominio/valores';
import { ahoraDb, conAhora } from '../ahora.ts';
import { dateDeFechaLocal } from '../mapeo/fechas.ts';
import { txPrisma, type EscritorTx, type LectorTx } from '../transacciones.ts';

export type SmsGuardado = { id: string; texto: string; remitente: string; recibidoEn: Date };

export async function guardarSms(
  tx: EscritorTx,
  sms: { texto: string; remitente: string },
): Promise<SmsGuardado> {
  const ahora = await ahoraDb(tx);
  return txPrisma(tx).smsRecibido.create({ data: conAhora('smsRecibido', sms, ahora) });
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
