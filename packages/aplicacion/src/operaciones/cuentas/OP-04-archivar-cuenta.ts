// OP-04 Archivar cuenta (04 §3.1): natural. Si ya está archivada, `ya_aplicada`; sin la cuenta, `no_encontrado`.
// Saldo 0, deuda 0 y reserva de pago(t) en 0 los verifica el dominio (`cuenta_con_saldo`, `tarjeta_con_deuda`,
// `reserva_tarjeta_no_cero`); la base lo repite en `g_archivar_cuenta` (inv. 24).
import { op04, type EntradaOp04, type SalidaCuenta } from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { cuentaDe } from './comunes.ts';

export const OP04: DefinicionOperacion<EntradaOp04, EntradaOp04, SalidaCuenta> = {
  id: 'OP-04',
  contrato: op04,
  idempotencia: 'natural',
  comprobarIdempotencia(_tx, e, h) {
    const cuenta = cuentaDe(h, e.cuentaId);
    if (cuenta === undefined) return { tipo: 'no_encontrado' };
    return cuenta.archivada ? { tipo: 'ya_aplicada', salida: {} } : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-04',
    cuentaId: e.cuentaId,
    ...(e.devolverAsignacionesFuturas === undefined
      ? {}
      : { devolverAsignacionesFuturas: e.devolverAsignacionesFuturas }),
  }),
  salida: () => ({}),
};
