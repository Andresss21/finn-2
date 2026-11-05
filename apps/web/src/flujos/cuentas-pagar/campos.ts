// Campos de `/cuentas/[cuentaId]/pagar` (FT-30): contrato y entrada de OP-23. Los valores son texto (05 §4.2); los rechazos de
// negocio (`fecha_posterior_a_hoy`, `cuenta_archivada`…) son del servidor: la interfaz no suma ni compara (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasPagar as t } from '../../textos/cuentas-pagar';

const CAMPOS = z.object({ origenId: z.string(), fecha: z.string(), total: z.string() });
export type Campos = z.infer<typeof CAMPOS>;

const escrito = (texto: string): boolean => normalizarMontoEscrito(texto).estado === 'valido';

/** Lo obligatorio escrito; que el monto sea mayor que cero y la fecha válida lo dice el servidor. */
export const contrato = CAMPOS.superRefine((c, ctx) => {
  const falta = (path: keyof Campos, message: string) => {
    ctx.addIssue({ code: 'custom', path: [path], message });
  };
  if (c.origenId === '') falta('origenId', t.elegirOrigen);
  if (c.fecha === '') falta('fecha', t.completar);
  if (!escrito(c.total)) falta('total', t.completar);
});

export function aEntradaDeAccion(tarjetaId: string, payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...resto } = payload as Record<string, unknown>;
  const c = resto as Campos;
  const total = normalizarMontoEscrito(c.total);
  return {
    tarjetaId,
    origenId: c.origenId,
    fecha: c.fecha,
    total: total.estado === 'valido' ? total.texto : c.total,
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Lo que dice la previsualización de OP-23 (04 §4.3): avisos con sus datos y el saldo a favor que dejaría el pago. */
export interface Previsualizacion {
  readonly impacto?: {
    readonly deltaLpa: number;
    readonly deltaReduccionProyectadaLpaAlCierre?: number;
  } | null;
  readonly nombres?: Readonly<Record<string, string>>;
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: Readonly<Record<string, unknown>>;
  }[];
  readonly propuesta?: { readonly saldoAFavor?: number };
}
