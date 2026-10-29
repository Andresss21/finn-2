// Contrato de OP-53 Verificar saldo (04 §3.8, CF-01; BE-08). En una tarjeta `saldoEstado` positivo es deuda, como en
// OP-01: el dominio lo convierte a la convención de 01 §0.4. `revisionVista` y `huellaImpacto` los separa el marco.
import * as z from 'zod';
import { fechaLocal, montoTextoConSigno, uuid } from './comunes.ts';

export const op53 = z.object({
  id: uuid,
  cuentaId: uuid,
  fechaEstado: fechaLocal,
  saldoEstado: montoTextoConSigno,
  marcar: z.union([
    z.strictObject({ todas: z.literal(true) }),
    z.strictObject({ ids: z.array(uuid) }),
  ]),
});
export type EntradaOp53 = z.output<typeof op53>;
