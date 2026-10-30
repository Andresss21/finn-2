// OP-26 Registrar desembolso de préstamo (04 §3.4): creación. Préstamo +total y efectivo +total (entra a LPA como otras
// entradas, 01 §4.13). Los rechazos (cuenta archivada, tipo, fechas) son los del dominio.
import { op26, type EntradaOp26, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP26: DefinicionOperacion<EntradaOp26, EntradaOp26, SalidaTransaccion> = {
  id: 'OP-26',
  contrato: op26,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (tx, e, h) =>
    creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'desembolso_prestamo',
      efectos: [
        { cuentaId: e.prestamoId, monto: e.total },
        { cuentaId: e.cuentaId, monto: e.total },
      ],
    }),
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-26',
    ...altaDe(e, instante, ids),
    prestamoId: e.prestamoId,
    cuentaId: e.cuentaId,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
