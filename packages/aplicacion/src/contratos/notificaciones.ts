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
