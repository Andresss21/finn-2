// Lecturas y purgas de la tarea diaria y la puesta al día (04 §10.1, §10.2; BE-50, BE-52, EN-1, EN-2). Todo cuelga de
// `finn.ahora()` (CT-02): ninguna fecha sale del reloj del proceso. Las purgas son transacciones [T] sin bloqueo.
import { ahoraDb } from '../ahora.ts';
import { txPrisma, txPrismaT, type EscritorTecnicoTx, type LectorTx } from '../transacciones.ts';
import { purgarEventos } from './eventos.ts';
import { purgarNotificaciones } from './notificaciones.ts';

const DIA_MS = 86_400_000;
const haceDias = async (tx: LectorTx | EscritorTecnicoTx, dias: number): Promise<Date> =>
  new Date((await ahoraDb(tx)).getTime() - dias * DIA_MS);

/** EN-2: `SELECT finn.purgar_eliminaciones()` (30 días fijos, y sube `revision_minima_incremental`). */
export async function purgarEliminaciones(tx: EscritorTecnicoTx): Promise<number> {
  const [f] = await txPrismaT(tx).$queryRaw<
    { n: number }[]
  >`SELECT finn.purgar_eliminaciones() AS n`;
  return f?.n ?? 0;
}

/** 04 §10.2 paso 5: `eventos_sistema` de más de 90 días, salvo la auditoría de formatos (EN-1). */
export const purgarEventosViejos = async (tx: EscritorTecnicoTx): Promise<number> =>
  purgarEventos(tx, await haceDias(tx, 90));

/** P4-11: `notificaciones` de más de 180 días. */
export const purgarNotificacionesViejas = async (tx: EscritorTecnicoTx): Promise<number> =>
  purgarNotificaciones(tx, await haceDias(tx, 180));

/** BE-52: `suscripciones_push` sin renovar en 60 días. */
export async function purgarSuscripcionesSinRenovar(tx: EscritorTecnicoTx): Promise<number> {
  const r = await txPrismaT(tx).suscripcionPush.deleteMany({
    where: { renovadaEn: { lt: await haceDias(tx, 60) } },
  });
  return r.count;
}

export type EventoDeTarea = {
  readonly mensaje: string;
  readonly ocurridoEn: Date;
  readonly ejecucion: string | null;
};

/** BE-50: los eventos `tarea_diaria` de `hoy` y el `finn.ahora()` con el que se comparan los 5 minutos. */
export async function eventosDeTareaDeHoy(
  tx: LectorTx,
  hoy: string,
): Promise<{ ahora: Date; eventos: EventoDeTarea[] }> {
  const filas = await txPrisma(tx).eventoSistema.findMany({
    where: { origen: 'tarea_diaria', datos: { path: ['hoy'], equals: hoy } },
    orderBy: { id: 'asc' },
  });
  return {
    ahora: await ahoraDb(tx),
    eventos: filas.map((f) => {
      const e = (f.datos as { ejecucion?: unknown } | null)?.ejecucion;
      return {
        mensaje: f.mensaje,
        ocurridoEn: f.ocurridoEn,
        ejecucion: typeof e === 'string' ? e : null,
      };
    }),
  };
}

export type CargaCompleta = {
  readonly ocurridoEn: Date;
  readonly bytes: number;
  readonly ms: number;
};

/** 04 §5.6: las cargas completas de los últimos `dias` días (`eventos_sistema`, origen `motor`). */
export async function cargasCompletasRecientes(
  tx: LectorTx,
  dias: number,
): Promise<CargaCompleta[]> {
  const filas = await txPrisma(tx).eventoSistema.findMany({
    where: {
      origen: 'motor',
      mensaje: 'carga_completa',
      ocurridoEn: { gte: await haceDias(tx, dias) },
    },
    orderBy: { id: 'asc' },
  });
  return filas.flatMap((f) => {
    const d = f.datos as { bytes?: unknown; ms?: unknown } | null;
    return typeof d?.bytes === 'number' && typeof d.ms === 'number'
      ? [{ ocurridoEn: f.ocurridoEn, bytes: d.bytes, ms: d.ms }]
      : [];
  });
}

/** 04 §10.2 paso 4 y §16: la última deriva de catálogo que informó el respaldo en los últimos 2 días. */
export async function ultimaDerivaInformada(tx: LectorTx): Promise<Date | null> {
  const f = await txPrisma(tx).eventoSistema.findFirst({
    where: { origen: 'respaldo', mensaje: 'deriva', ocurridoEn: { gte: await haceDias(tx, 2) } },
    orderBy: { id: 'desc' },
  });
  return f?.ocurridoEn ?? null;
}

/** [CH-47] ¿Ya hay datos que respaldar? Una cuenta (`fecha_apertura`) o un evento `carga_completa`. */
export async function hayPrimerHecho(tx: LectorTx): Promise<boolean> {
  const p = txPrisma(tx);
  const cuenta = await p.cuenta.findFirst({ select: { id: true } });
  if (cuenta !== null) return true;
  const carga = await p.eventoSistema.findFirst({
    where: { origen: 'motor', mensaje: 'carga_completa' },
    select: { id: true },
  });
  return carga !== null;
}

/** BE-38: ¿hay una notificación con esta `datos.clave`? (una vez por día, por período…). */
export async function existeNotificacionConClave(tx: LectorTx, clave: string): Promise<boolean> {
  const f = await txPrisma(tx).notificacion.findFirst({
    where: { datos: { path: ['clave'], equals: clave } },
    select: { id: true },
  });
  return f !== null;
}
