// Paso 5 de la tarea diaria (04 §10.2): las purgas de las tablas [T], cada una en su transacción corta y sin bloqueo
// (03 §5.1, §13.4). `eliminaciones` y `revision_minima_incremental` van por `finn.purgar_eliminaciones()` (EN-2); los
// eventos conservan la auditoría de formatos (EN-1); notificaciones a los 180 días (P4-11); suscripciones a los 60 (BE-52).
import {
  escribirTecnico as escribirTecnicoDb,
  purgarEliminaciones,
  purgarEventosViejos,
  purgarNotificacionesViejas,
  purgarSuscripcionesSinRenovar,
  type EscritorTecnicoTx,
} from '@finn/db';
import type { DepsMarco } from '../operaciones/marco.ts';

export interface ResultadoDePaso {
  readonly cantidad: number;
  /** Cifras del paso para el evento de fin (04 §10.2, paso 7). */
  readonly detalle?: Readonly<Record<string, number>>;
}

const PURGAS: readonly (readonly [string, (tx: EscritorTecnicoTx) => Promise<number>])[] = [
  ['eliminaciones', purgarEliminaciones],
  ['eventos', purgarEventosViejos],
  ['notificaciones', purgarNotificacionesViejas],
  ['suscripciones', purgarSuscripcionesSinRenovar],
];

/** Hace todas las purgas aunque una falle (cada una es idempotente, 10.3); si alguna falló, lanza la primera. */
export async function purgar(d: DepsMarco): Promise<ResultadoDePaso> {
  const detalle: Record<string, number> = {};
  let fallo: { readonly e: unknown } | null = null;
  for (const [tabla, purga] of PURGAS)
    try {
      detalle[tabla] = await (d.escribirTecnico ?? escribirTecnicoDb)(
        (tx) => purga(tx),
        d.opciones?.(),
      );
    } catch (e) {
      fallo ??= { e };
    }
  if (fallo) throw fallo.e;
  return { cantidad: Object.values(detalle).reduce((a, b) => a + b, 0), detalle };
}
