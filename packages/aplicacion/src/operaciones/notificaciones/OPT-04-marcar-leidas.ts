// OPT-04 Marcar notificaciones como leídas (04 §3.10, §11): `ids` o `todas: true` → `notificaciones.leida_en`.
// No escribe hechos del motor, así que no pasa por `aplicar` del marco: valida el contrato y escribe en una
// transacción corta de `escribir()` (el único servicio que abre transacciones, 04 §4.1). Natural (04 §4.6): lo ya
// leído conserva su `leida_en`; repetirla marca 0.
import * as z from 'zod';
import { escribir, marcarLeidas, type OpcionesTx } from '@finn/db';
import { uuid } from '../../contratos/comunes.ts';
import { errorDeValidacion, type ResultadoAccion } from '../../errores/index.ts';

const MAXIMO_IDS = 200;
const AVISO_VACIO = 'Elegí al menos una notificación.';

export const optLeidas = z.union(
  [
    z.strictObject({ ids: z.array(uuid).min(1, { error: AVISO_VACIO }).max(MAXIMO_IDS) }),
    z.strictObject({ todas: z.literal(true) }),
  ],
  { error: AVISO_VACIO },
);
export type EntradaLeidas = z.infer<typeof optLeidas>;
export interface SalidaLeidas {
  /** Cuántas pasaron de no leídas a leídas en esta llamada. */
  readonly marcadas: number;
}

export async function marcarNotificacionesLeidas(
  cruda: unknown,
  opciones?: () => OpcionesTx,
): Promise<ResultadoAccion<SalidaLeidas>> {
  const analizada = optLeidas.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const marcadas = await escribir((tx) => marcarLeidas(tx, analizada.data), opciones?.());
  return { ok: true, valor: { marcadas }, yaAplicada: marcadas === 0, avisos: [] };
}
