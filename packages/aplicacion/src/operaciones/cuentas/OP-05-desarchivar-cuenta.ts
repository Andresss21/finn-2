// OP-05 Desarchivar cuenta (04 §3.1): natural. Si no está archivada, `ya_aplicada`; sin la cuenta, `no_encontrado`.
// El dominio desarchiva también la categoría de pago de una tarjeta.
import { op05, type EntradaCuenta, type SalidaCuenta } from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { cuentaDe } from './comunes.ts';

export const OP05: DefinicionOperacion<EntradaCuenta, EntradaCuenta, SalidaCuenta> = {
  id: 'OP-05',
  contrato: op05,
  idempotencia: 'natural',
  async comprobarIdempotencia(tx, e) {
    const cuenta = await cuentaDe(tx, e.cuentaId);
    if (cuenta === undefined) return { tipo: 'no_encontrado' };
    return cuenta.archivada ? { tipo: 'aplicar' } : { tipo: 'ya_aplicada', salida: {} };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({ operacion: 'OP-05', cuentaId: e.cuentaId }),
  salida: () => ({}),
};
