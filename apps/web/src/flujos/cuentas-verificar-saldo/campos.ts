// Campos de `/cuentas/[cuentaId]/verificar-saldo` (FT-44): contrato de la pantalla y entrada de OP-53. Los valores son texto
// (05 §4.2); la diferencia, el saldo de Finn y los rechazos los dice el servidor (PF-3).
import * as z from 'zod';
import { aplicarSigno, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { verificarSaldo as t } from '../../textos/verificar-saldo';

const CAMPOS = z.object({
  fecha: z.string(),
  saldo: z.string(),
  /** Solo una tarjeta lo usa: positivo = deuda (04 OP-53). */
  signo: z.enum(['positivo', 'negativo']),
});
export type Campos = z.infer<typeof CAMPOS>;

/** Lo obligatorio escrito. */
export const contrato = CAMPOS.superRefine((c, ctx) => {
  if (c.fecha === '') ctx.addIssue({ code: 'custom', path: ['fecha'], message: t.completar });
  if (normalizarMontoEscrito(c.saldo).estado !== 'valido')
    ctx.addIssue({ code: 'custom', path: ['saldo'], message: t.completar });
});

/** Lo que marca la persona: todas las candidatas, o las elegidas. */
export type Marcar = 'todas' | readonly string[];

/** La entrada de OP-53 desde lo que arma `useOperacion` (`modo`, `id`, `revisionVista`, `huellaImpacto` y los campos). */
export function aEntradaDeAccion(
  cuentaId: string,
  tarjeta: boolean,
  payload: unknown,
): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, marcar, fecha, saldo, signo } = payload as Record<
    string,
    unknown
  > &
    Campos & { marcar?: Marcar };
  const monto = normalizarMontoEscrito(saldo);
  const texto = monto.estado === 'valido' ? monto.texto : saldo;
  return {
    id,
    modo,
    cuentaId,
    fechaEstado: fecha,
    saldoEstado: aplicarSigno(texto, tarjeta ? signo : 'positivo'),
    marcar: marcar === undefined || marcar === 'todas' ? { todas: true } : { ids: marcar },
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}
