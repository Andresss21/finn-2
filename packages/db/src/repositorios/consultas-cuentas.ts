// Lecturas [H] e [I] de las consultas de cuentas y actividad (TA-171; 04 §6.5 a §6.7): instituciones, cambios
// posteriores, búsqueda por texto y origen por SMS. No entran en la instantánea del motor (5.2); las consultas se las
// pasan a los selectores, que son puros (6.0.5).
import type { CambioPosterior, Instante, Institucion, Uuid } from '@finn/dominio';
import { Centavos } from '@finn/dominio/valores';
import { fechaLocalDeDate, instanteDeDate } from '../mapeo/fechas.ts';
import { txPrisma, type LectorTx } from '../transacciones.ts';

export async function leerInstituciones(tx: LectorTx): Promise<Institucion[]> {
  const filas = await txPrisma(tx).institucion.findMany({ orderBy: { id: 'asc' } });
  return filas.map((f) => ({ id: f.id as Uuid, nombre: f.nombre }));
}

/** El nombre de una institución [H] (03 §3.3), o `null` si no existe: lo usa el marco para los rechazos (04 §3.0.6). */
export async function nombreDeInstitucion(tx: LectorTx, id: string): Promise<string | null> {
  const fila = await txPrisma(tx).institucion.findUnique({
    where: { id },
    select: { nombre: true },
  });
  return fila?.nombre ?? null;
}

/** `cambios_posteriores` [H] (03 §3.27), en orden estable. */
export async function leerCambiosPosteriores(tx: LectorTx): Promise<CambioPosterior[]> {
  const filas = await txPrisma(tx).cambioPosterior.findMany({
    orderBy: [{ registradoEn: 'asc' }, { id: 'asc' }],
  });
  return filas.map((f) => ({
    id: f.id as Uuid,
    conciliacionId: f.conciliacionId as Uuid,
    transaccionId: f.transaccionId as Uuid | null,
    registradoEn: instanteDeDate(f.registradoEn) as Instante,
    motivos: f.motivos,
    fecha: fechaLocalDeDate(f.fecha),
    montoEfecto: Centavos.desdeEntero(f.montoEfecto),
    comercio: f.comercio,
  }));
}

/** Búsqueda de 04 §6.7.1: `comercio ILIKE` o `nota ILIKE`; el texto se escapa (`\`, `%` y `_`) porque Prisma no lo hace. */
export async function idsDeTransaccionesPorTexto(tx: LectorTx, texto: string): Promise<Set<Uuid>> {
  const patron = texto.replace(/[\\%_]/g, '\\$&');
  const filas = await txPrisma(tx).transaccion.findMany({
    where: {
      OR: [
        { comercio: { contains: patron, mode: 'insensitive' } },
        { nota: { contains: patron, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  return new Set(filas.map((f) => f.id as Uuid));
}

/** El SMS que originó una transacción aprobada (`movimientos.transaccion_id` único, 03 §3.17). */
export async function smsDeTransaccion(
  tx: LectorTx,
  transaccionId: string,
): Promise<{ texto: string; recibidoEn: Instante; movimientoId: Uuid } | null> {
  const m = await txPrisma(tx).movimiento.findUnique({
    where: { transaccionId },
    select: { id: true, sms: { select: { texto: true, recibidoEn: true } } },
  });
  return m === null
    ? null
    : {
        texto: m.sms.texto,
        recibidoEn: instanteDeDate(m.sms.recibidoEn) as Instante,
        movimientoId: m.id as Uuid,
      };
}

/** `transacciones.monto_original` (informativo; el motor no lo carga, 03 §3.12), como texto decimal. */
export async function montoOriginalDe(tx: LectorTx, transaccionId: string): Promise<string | null> {
  const f = await txPrisma(tx).transaccion.findUnique({
    where: { id: transaccionId },
    select: { montoOriginal: true },
  });
  return f?.montoOriginal?.toString() ?? null;
}
