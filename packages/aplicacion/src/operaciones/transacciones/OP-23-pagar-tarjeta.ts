// OP-23 Pagar tarjeta (04 §3.4): creación; efectivo −total, tarjeta +total y una línea a pago(t) por el total. AV-10 (el
// pago supera lo reservado) y AV-01 (período cerrado) piden confirmar con la huella; los produce el dominio.
import { calcular } from '@finn/dominio';
import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { op23, type EntradaOp23, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP23: DefinicionOperacion<EntradaOp23, EntradaOp23, SalidaTransaccion> = {
  id: 'OP-23',
  contrato: op23,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(tx, e, h) {
    // pago(t) (inv. 22); sin ella la tarjeta no existe y el dominio rechaza, salvo que el id ya esté usado
    const pago = h.categorias.find((c) => c.tarjetaId === e.tarjetaId);
    return creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'pago_tarjeta',
      efectos: [
        { cuentaId: e.origenId, monto: Centavos.negar(e.total) },
        { cuentaId: e.tarjetaId, monto: e.total },
      ],
      lineas: [{ monto: e.total, destino: { categoriaId: pago?.id ?? e.tarjetaId } }],
    });
  },
  resolver: (_tx, e) => Promise.resolve(e),
  /** "Quedará saldo a favor de {monto}" (04 OP-23, Avisos): lo que le sobra a la tarjeta después del pago; el cliente no lo calcula. */
  proponer(tx, e, h) {
    const saldo = calcular(h, FechaLocal.desdeTexto(tx.estado.hoy)).cuentas.find(
      (c) => c.cuentaId === e.tarjetaId,
    )?.saldo;
    return {
      saldoAFavor: Centavos.max(Centavos.cero, Centavos.sumar(saldo ?? Centavos.cero, e.total)),
    };
  },
  comando: (e, instante, ids) => ({
    operacion: 'OP-23',
    ...altaDe(e, instante, ids),
    origenId: e.origenId,
    tarjetaId: e.tarjetaId,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
