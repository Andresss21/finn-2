// OP-06 Eliminar cuenta (04 §3.1): eliminación (4.6.3) y confirmación siempre (AV-15, 4.3). Si la cuenta ya no
// existe pero `eliminaciones` la registra (30 días, 03 §5.3), `ya_aplicada`; si no, `no_encontrado`. Declara
// `eliminar_cuenta` para los triggers de la base (DB-20).
import { fueEliminada } from '@finn/db';
import { op06, type EntradaCuenta, type SalidaCuenta } from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { cuentaDe } from './comunes.ts';

export const OP06: DefinicionOperacion<EntradaCuenta, EntradaCuenta, SalidaCuenta> = {
  id: 'OP-06',
  contrato: op06,
  idempotencia: 'eliminacion',
  exigeConfirmacion: true,
  operacionDeclarada: 'eliminar_cuenta',
  async comprobarIdempotencia(tx, e, h) {
    if (cuentaDe(h, e.cuentaId) !== undefined) return { tipo: 'aplicar' };
    return (await fueEliminada(tx, 'cuentas', e.cuentaId))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({ operacion: 'OP-06', cuentaId: e.cuentaId }),
  salida: () => ({}),
};
