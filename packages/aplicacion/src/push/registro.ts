// Registro de notificaciones (04 §11.1: el registro es la fuente de verdad y va antes del push; BE-38).
// El `aviso` sale siempre del catálogo, nunca del llamador (CF-16). Solo escribe; el envío del push es de otra pieza.
import { crearNotificacion, type DatosNotificacion as DatosJson, type EscritorTx } from '@finn/db';
import { MOTIVOS, type MotivoNotificacion } from './motivos.ts';

export interface DatosNotificacion {
  readonly titulo: string;
  readonly cuerpo: string;
  /** Solo referencias (ADR-12): `destino` de 04 §11.4 y los ids que el destino necesita. */
  readonly datos?: DatosJson;
}

export interface NotificacionRegistrada {
  readonly id: string;
  /** Si el catálogo manda push para este motivo; el llamador lo envía después del COMMIT. */
  readonly conPush: boolean;
}

/** Inserta la notificación del motivo con el aviso del catálogo (`null` si no es un aviso del dominio). */
export async function registrarNotificacion(
  tx: EscritorTx,
  motivo: MotivoNotificacion,
  d: DatosNotificacion,
): Promise<NotificacionRegistrada> {
  const def = MOTIVOS[motivo];
  const fila = await crearNotificacion(tx, {
    aviso: def.aviso,
    motivo,
    titulo: d.titulo,
    cuerpo: d.cuerpo,
    ...(d.datos === undefined ? {} : { datos: d.datos }),
  });
  return { id: fila.id, conPush: def.push.enviar };
}

/**
 * AV-01 "después" (BE-38): el resumen del impacto queda registrado, sin push, para que Inicio lo muestre hasta que se
 * marque como leído (OPT-04). Lo llama `posteriores()` de la operación que produjo el aviso (04 §4.9).
 */
export const registrarCambioRetroactivo = (
  tx: EscritorTx,
  resumen: { readonly titulo: string; readonly cuerpo: string },
): Promise<NotificacionRegistrada> =>
  registrarNotificacion(tx, 'cambio_retroactivo', {
    ...resumen,
    datos: { destino: { pantalla: 'inicio' } },
  });
