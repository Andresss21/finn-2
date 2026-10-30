// La acción desde una notificación (04 §11.5, BE-54), sin HTTP: el Route Handler de la Parte C solo traduce la petición
// y la respuesta. Exige `Origin` de la app, `X-Finn-Accion` y sesión AAL2 con `getUser()` antes de ejecutar OP-40.
import * as z from 'zod';
import { exigirSesionEscritura, type SesionServidor } from '../autenticacion/autorizar.ts';
import type { EntradaOp40 } from '../contratos/bandeja.ts';
import { uuid } from '../contratos/comunes.ts';
import { uuidv5 } from '../ids.ts';
import { OP40 } from '../operaciones/bandeja/OP-40-resolver.ts';
import { confirmar, type DepsMarco } from '../operaciones/marco.ts';

export interface PeticionAccion {
  readonly origen: string | null;
  readonly cabeceraAccion: string | null;
  readonly cuerpo: unknown;
}
export interface DepsAccion extends DepsMarco {
  /** El origen de la app. */
  readonly origenApp: string;
  readonly sesion: SesionServidor;
  /** `FINN_USUARIO_ID`, ya validado por la configuración. */
  readonly usuarioPermitido: string;
}
/** 200 "Listo"; 401 abre la bandeja; 409 y 422 abren el movimiento (11.5); 403 y 503 no ejecutan nada. */
export type EstadoAccion = 200 | 401 | 403 | 409 | 422 | 503;

const cuerpoAccion = z.strictObject({
  notificacionId: uuid,
  movimientoId: uuid,
  decision: z.enum(['confirmar', 'rechazar']),
});

/** La misma notificación da siempre el mismo id de creación: confirmar dos veces es una sola aprobación. */
const NOMBRE_ID = 'accion-notificacion';

export async function ejecutarAccionDeNotificacion(
  p: PeticionAccion,
  d: DepsAccion,
): Promise<{ readonly estado: EstadoAccion }> {
  if (p.origen !== d.origenApp || p.cabeceraAccion !== '1') return { estado: 403 };
  const sesion = await exigirSesionEscritura(d.sesion, d.usuarioPermitido);
  if (!sesion.ok) return { estado: 401 };
  const c = cuerpoAccion.safeParse(p.cuerpo);
  if (!c.success) return { estado: 422 };
  const { notificacionId, movimientoId, decision } = c.data;
  const entrada: EntradaOp40 =
    decision === 'confirmar'
      ? {
          decision: 'confirmar_coincidencia',
          movimientoId,
          id: uuidv5(NOMBRE_ID, notificacionId),
        }
      : { decision: 'rechazar_coincidencia', movimientoId };
  const r = await confirmar(OP40, entrada, d);
  if (r.ok) return { estado: 200 };
  const { categoria } = r.error;
  if (categoria === 'NO_AUTORIZADO') return { estado: 401 };
  if (categoria === 'CONFLICTO') return { estado: 409 };
  return { estado: categoria === 'INTERNO' || categoria === 'OCUPADO' ? 503 : 422 };
}
