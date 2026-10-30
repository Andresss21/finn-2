// Contrato de OP-19 Cambiar el ciclo (04 §3.3; BE-08). `revisionVista` y `huellaImpacto` los separa el marco antes de
// validar; AV-12 pide siempre la confirmación.
import * as z from 'zod';

/** OP-19: el nuevo día de inicio del ciclo, de 1 a 31. */
export const op19 = z.object({
  diaInicio: z
    .number({ error: 'Ingresá un día.' })
    .int({ error: 'Ingresá un día entero.' })
    .min(1, { error: 'El día va de 1 a 31.' })
    .max(31, { error: 'El día va de 1 a 31.' }),
});
export type EntradaOp19 = z.output<typeof op19>;

/** Salida de OP-19: no informa nada (04 §3.0.3). */
export type SalidaAjustes = Record<string, never>;
