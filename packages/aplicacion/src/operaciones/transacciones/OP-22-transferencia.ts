// OP-22 Transferencia neutral (04 §3.4): creación; −total en el origen y +total en el destino, dos cuentas de efectivo
// distintas (`cuentas_iguales` lo rechaza el dominio). Solo cambian los saldos.
import { Centavos } from '@finn/dominio/valores';
import { op22, type EntradaOp22, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP22: DefinicionOperacion<EntradaOp22, EntradaOp22, SalidaTransaccion> = {
  id: 'OP-22',
  contrato: op22,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (tx, e, h) =>
    creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'transferencia',
      efectos: [
        { cuentaId: e.origenId, monto: Centavos.negar(e.total) },
        { cuentaId: e.destinoId, monto: e.total },
      ],
    }),
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-22',
    ...altaDe(e, instante, ids),
    origenId: e.origenId,
    destinoId: e.destinoId,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
