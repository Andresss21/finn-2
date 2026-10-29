// OP-21 Registrar ingreso (04 §3.4): creación; +total en una cuenta de efectivo, sin líneas (el ingreso entra a LPA).
import { op21, type EntradaOp21, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP21: DefinicionOperacion<EntradaOp21, EntradaOp21, SalidaTransaccion> = {
  id: 'OP-21',
  contrato: op21,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (tx, e, h) =>
    creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'ingreso',
      efectos: [{ cuentaId: e.cuentaId, monto: e.total }],
    }),
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-21',
    ...altaDe(e, instante, ids),
    cuentaId: e.cuentaId,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
