// `DestinoNotificacion` (04 §11.4, CP-1): el tipo cerrado de `notificaciones.datos.destino`, importable por el cliente y
// el service worker. Un destino que no valida se trata como ausente (6.12.5).
import * as z from 'zod';
import { fechaLocal, uuid } from './comunes.ts';

export const destinoNotificacion = z.discriminatedUnion('pantalla', [
  z.object({ pantalla: z.literal('inicio') }),
  z.object({ pantalla: z.literal('bandeja') }),
  z.object({ pantalla: z.literal('movimiento'), movimientoId: uuid }),
  z.object({ pantalla: z.literal('transaccion'), transaccionId: uuid }),
  z.object({
    pantalla: z.literal('programada'),
    programadaId: uuid,
    fechaEsperada: fechaLocal.optional(),
  }),
  z.object({ pantalla: z.literal('presupuesto'), periodoInicio: fechaLocal }),
  z.object({
    pantalla: z.literal('categoria'),
    categoriaId: uuid,
    periodoInicio: fechaLocal.optional(),
  }),
  z.object({ pantalla: z.literal('diagnostico') }),
  z.object({ pantalla: z.literal('cuenta'), cuentaId: uuid }),
]);

export type DestinoNotificacion = z.output<typeof destinoNotificacion>;

/** La carga útil del push (04 §11.4, CP-1, CP-18): sin montos ni nombres más allá de 11.4. */
export interface CargaPush {
  readonly notificacionId: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema' | 'tarjetas';
  readonly destino?: DestinoNotificacion;
  readonly acciones?: ('confirmar' | 'rechazar')[];
}

const endpoint = z
  .url({ protocol: /^https$/, error: 'La suscripción no es válida.' })
  .max(2048, { error: 'La suscripción no es válida.' });
const claveBase64Url = z.string().regex(/^[\w-]{1,200}={0,2}$/);

/** OPT-02 (04 §3.10). */
export const optSuscripcion = z.strictObject({
  endpoint,
  claves: z.strictObject({ p256dh: claveBase64Url, auth: claveBase64Url }),
  agente: z.string().max(500).optional(),
});
/** OPT-03 (04 §3.10). */
export const optEliminarSuscripcion = z.strictObject({ endpoint });
