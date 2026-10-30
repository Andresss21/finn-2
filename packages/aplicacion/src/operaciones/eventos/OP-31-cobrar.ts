// OP-31 Cobrar (04 §3.5): creación de una transacción `cobro` con +total en la cuenta, vinculada a la línea por cobrar.
// Con `asignarAPagoTarjeta` el dominio asigna además la restitución a pago(t) en la misma operación (BE-36); el aviso
// AV-22 (la propuesta) y AV-05 llegan en los avisos de la previsualización. La huella de 4.6.1 compara además la línea
// cobrada: el mismo id con otra línea es `conflicto_id`.
import { op31, type EntradaOp31 } from '../../contratos/eventos.ts';
import type { SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from '../transacciones/comunes.ts';

export const OP31: DefinicionOperacion<EntradaOp31, EntradaOp31, SalidaTransaccion> = {
  id: 'OP-31',
  contrato: op31,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e, h) {
    const v = await creacion(tx, h, e.id, {
      entrada: e,
      tipo: 'cobro',
      efectos: [{ cuentaId: e.cuentaId, monto: e.total }],
    });
    if (v.tipo !== 'ya_aplicada') return v;
    return h.transacciones.find((t) => t.id === e.id)?.lineaCobradaId === e.lineaId
      ? v
      : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-31',
    ...altaDe(e, instante, ids),
    lineaId: e.lineaId,
    cuentaId: e.cuentaId,
    ...(e.asignarAPagoTarjeta === undefined ? {} : { asignarAPagoTarjeta: e.asignarAPagoTarjeta }),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
