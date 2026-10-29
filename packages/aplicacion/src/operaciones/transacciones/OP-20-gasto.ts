// OP-20 Registrar gasto (04 §3.4): creación, clave `transacciones.id` (4.6.1). El dominio escribe la transacción, su efecto
// −total y una línea por destino (categoría, deudor o deudor nuevo, PT); aquí viven el contrato, los ids derivados del
// principal (BE-31) y la huella de creación. AV-01 y AV-07/AV-09 los produce `aplicar`; AV-01 pide confirmar.
import { Centavos } from '@finn/dominio/valores';
import { op20, type EntradaOp20, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP20: DefinicionOperacion<EntradaOp20, EntradaOp20, SalidaTransaccion> = {
  id: 'OP-20',
  contrato: op20,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (tx, e, h) =>
    creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'gasto',
      efectos: [{ cuentaId: e.cuentaId, monto: Centavos.negar(e.total) }],
      lineas: e.lineas,
    }),
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-20',
    ...altaDe(e, instante, ids),
    cuentaId: e.cuentaId,
    lineas: e.lineas,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
