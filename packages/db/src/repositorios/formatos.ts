// Formatos bancarios e instituciones [H] (03 §3.20, §3.21; 04 §8.7: OPT-05, OPT-07) y su auditoría (BE-47, EN-1).
// Las escrituras exigen un `EscritorTx` (con el bloqueo tomado); no entran en la instantánea del motor.
import { ahoraDb, conAhora } from '../ahora.ts';
import { txPrisma, txPrismaT, type EscritorTx, type LectorTx } from '../transacciones.ts';
import type { DatosEvento } from './eventos.ts';

/** La fila completa de `formatos_bancarios` con los nombres del código (03 §3.21). */
export interface FilaFormato {
  readonly id: string;
  readonly institucionId: string;
  readonly nombre: string;
  readonly tipoMovimiento: 'compra' | 'deposito' | 'pago_tarjeta' | 'devolucion';
  readonly patron: string;
  readonly banderas: string;
  readonly montoSeparadorMiles: ',' | '.' | '';
  readonly montoSeparadorDecimal: '.' | ',';
  readonly formatosFecha: readonly string[];
  readonly activo: boolean;
}
export interface FilaInstitucion {
  readonly id: string;
  readonly nombre: string;
}

const seleccion = {
  id: true,
  institucionId: true,
  nombre: true,
  tipoMovimiento: true,
  patron: true,
  banderas: true,
  montoSeparadorMiles: true,
  montoSeparadorDecimal: true,
  formatosFecha: true,
  activo: true,
} as const;

export async function leerFormato(tx: LectorTx, id: string): Promise<FilaFormato | null> {
  const f = await txPrisma(tx).formatoBancario.findUnique({ where: { id }, select: seleccion });
  return f as FilaFormato | null;
}

/** ¿Otro formato de la misma institución tiene ese nombre? (`UNIQUE (institucion_id, nombre)`.) */
export async function nombreDeFormatoEnUso(
  tx: LectorTx,
  institucionId: string,
  nombre: string,
  exceptoId: string,
): Promise<boolean> {
  const n = await txPrisma(tx).formatoBancario.count({
    where: { institucionId, nombre, id: { not: exceptoId } },
  });
  return n > 0;
}

/** Inserta o reemplaza la fila completa del formato (OPT-05). */
export async function guardarFormato(tx: EscritorTx, f: FilaFormato): Promise<void> {
  const datos = { ...f, formatosFecha: [...f.formatosFecha] };
  await txPrisma(tx).formatoBancario.upsert({ where: { id: f.id }, create: datos, update: datos });
}

export async function leerInstitucion(tx: LectorTx, id: string): Promise<FilaInstitucion | null> {
  return txPrisma(tx).institucion.findUnique({ where: { id }, select: { id: true, nombre: true } });
}

/** ¿Otra institución tiene ese nombre, sin distinguir mayúsculas? (OPT-07, 04 §8.7: verificado bajo el bloqueo.) */
export async function nombreDeInstitucionEnUso(
  tx: LectorTx,
  nombre: string,
  exceptoId: string,
): Promise<boolean> {
  const filas = await txPrisma(tx).$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM finn.instituciones
    WHERE lower(nombre) = lower(${nombre}) AND id <> ${exceptoId}::uuid`;
  return (filas[0]?.n ?? 0) > 0;
}

export async function guardarInstitucion(tx: EscritorTx, i: FilaInstitucion): Promise<void> {
  await txPrisma(tx).institucion.upsert({
    where: { id: i.id },
    create: { id: i.id, nombre: i.nombre },
    update: { nombre: i.nombre },
  });
}

export type AccionAuditoriaFormato = 'crear' | 'editar' | 'activar' | 'desactivar';

/**
 * BE-47, EN-1: la fila de auditoría en la misma transacción del formato (04 §8.7). Guarda la fila completa antes y
 * después, así que no pasa por `sanearDatos()` (que quitaría `nombre`): un formato no lleva datos personales.
 * Su `datos.tipo` la excluye de la purga de 90 días (`purgarEventos`).
 */
export async function registrarAuditoriaFormato(
  tx: EscritorTx,
  a: {
    readonly accion: AccionAuditoriaFormato;
    readonly sesion: string;
    readonly antes: FilaFormato | null;
    readonly despues: FilaFormato;
  },
): Promise<void> {
  const ahora = await ahoraDb(tx);
  const fila = (f: FilaFormato | null): DatosEvento | null =>
    f === null ? null : { ...f, formatosFecha: [...f.formatosFecha] };
  const datos = {
    tipo: 'auditoria_formato',
    formatoId: a.despues.id,
    accion: a.accion,
    sesion: a.sesion,
    antes: fila(a.antes),
    despues: fila(a.despues),
  } satisfies DatosEvento;
  await txPrismaT(tx).eventoSistema.create({
    data: conAhora(
      'eventoSistema',
      {
        nivel: 'info' as const,
        origen: 'app',
        mensaje: `auditoria_formato ${a.accion}`,
        datos: datos as never,
      },
      ahora,
    ),
  });
}
