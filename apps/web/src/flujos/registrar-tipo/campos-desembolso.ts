// Los campos de `/registrar/desembolso` (FT-56), su contrato y la entrada de OP-26. Los valores del formulario son texto, como los
// escribe la persona (05 §4.2); el contrato completo y los rechazos de negocio (`cuenta_tipo_no_valido`…) son del servidor.
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { registrarDesembolso as d } from '../../textos/registrar-desembolso';
import { registrarTipo as t } from '../../textos/registrar-tipo';

/** `[tipo]` de la URL (05 §2.4) → el desembolso; cualquier otro lo atienden otras fichas. */
export const esDesembolso = (url: string): boolean => url === 'desembolso';

const CAMPOS = z.object({
  prestamoId: z.string(),
  cuentaId: z.string(),
  fecha: z.string(),
  total: z.string(),
});
export type CamposDesembolso = z.infer<typeof CAMPOS>;

export const contratoDesembolso = CAMPOS.superRefine((c, ctx) => {
  if (c.prestamoId === '')
    ctx.addIssue({ code: 'custom', path: ['prestamoId'], message: d.elegirPrestamo });
  if (c.cuentaId === '')
    ctx.addIssue({ code: 'custom', path: ['cuentaId'], message: t.elegirCuenta });
  if (c.fecha === '') ctx.addIssue({ code: 'custom', path: ['fecha'], message: t.completar });
  if (normalizarMontoEscrito(c.total).estado !== 'valido')
    ctx.addIssue({ code: 'custom', path: ['total'], message: t.completar });
});

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-26 sale de ellos. */
export function aEntradaDeDesembolso(payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<string, unknown>;
  const c = escrito as CamposDesembolso;
  const m = normalizarMontoEscrito(c.total);
  return {
    prestamoId: c.prestamoId,
    cuentaId: c.cuentaId,
    fecha: c.fecha,
    total: m.estado === 'valido' ? m.texto : c.total,
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Los valores con que abre el formulario: la fecha es el `hoy` del servidor (05 §5.5); `?cuenta=` propone el préstamo o la cuenta. */
export const valoresInicialesDesembolso = (
  hoy: string,
  prestamoPropuesto: string | undefined,
  cuentaPropuesta: string | undefined,
): CamposDesembolso => ({
  prestamoId: prestamoPropuesto ?? '',
  cuentaId: cuentaPropuesta ?? '',
  fecha: hoy,
  total: '',
});
