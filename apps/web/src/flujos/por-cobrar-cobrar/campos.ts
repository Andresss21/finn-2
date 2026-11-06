// Campos de `/por-cobrar/cobrar` (FT-46): contrato y entrada de OP-31. Los valores son texto (05 §4.2); los rechazos de negocio
// (`sin_saldo_abierto`, `fecha_posterior_a_hoy`, `cuenta_archivada`…) son del servidor: la interfaz no suma ni compara (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';

const CAMPOS = z.object({
  lineaId: z.string(),
  cuentaId: z.string(),
  fecha: z.string(),
  total: z.string(),
  reservar: z.boolean(),
});
export type Campos = z.infer<typeof CAMPOS>;

const escrito = (texto: string): boolean => normalizarMontoEscrito(texto).estado === 'valido';

/** Lo obligatorio escrito; que el monto sea mayor que cero y la fecha válida lo dice el servidor. */
export const contrato = CAMPOS.superRefine((c, ctx) => {
  const falta = (path: keyof Campos, message: string) => {
    ctx.addIssue({ code: 'custom', path: [path], message });
  };
  if (c.lineaId === '') falta('lineaId', t.marcadorPartida);
  if (c.cuentaId === '') falta('cuentaId', t.elegirCuenta);
  if (c.fecha === '') falta('fecha', t.completar);
  if (!escrito(c.total)) falta('total', t.completar);
});

/** La casilla solo viaja si hay propuesta AV-22 con esa cuenta (`conCasilla`, que decide el lector): si no, no se envía. */
export function aEntradaDeAccion(
  payload: unknown,
  conCasilla: (c: Campos) => boolean,
): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...resto } = payload as Record<string, unknown>;
  const c = resto as Campos;
  const total = normalizarMontoEscrito(c.total);
  return {
    lineaId: c.lineaId,
    cuentaId: c.cuentaId,
    fecha: c.fecha,
    total: total.estado === 'valido' ? total.texto : c.total,
    ...(conCasilla(c) ? { asignarAPagoTarjeta: c.reservar } : {}),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}
