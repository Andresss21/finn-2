// OP-31 Cobrar (04 §3.5): creación de una transacción `cobro` con +total en la cuenta, vinculada a la línea por cobrar.
// Con `asignarAPagoTarjeta` el dominio asigna además la restitución a pago(t) en la misma operación (BE-36); el aviso
// AV-22 (la propuesta) y AV-05 llegan en los avisos de la previsualización. La huella de 4.6.1 compara además la línea
// cobrada: el mismo id con otra línea es `conflicto_id`. La casilla sin propuesta AV-22 es una entrada imposible:
// `resolver` la devuelve como VALIDACION en vez de dejar que el dominio la trate como un error del sistema.
import type { Hechos } from '@finn/dominio';
import { op31, type EntradaOp31 } from '../../contratos/eventos.ts';
import type { SalidaTransaccion } from '../../contratos/transacciones.ts';
import { ErrorValidacion, type DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from '../transacciones/comunes.ts';

/**
 * ¿Le falta a la casilla su propuesta AV-22? AV-22 existe si la compra se pagó con una tarjeta t que tiene pago(t) y
 * el cobro entra en efectivo (01 §4.10, O1). Si la línea o la cuenta no sirven, decide el dominio con su rechazo.
 */
function casillaSinPropuesta(h: Hechos, e: EntradaOp31): boolean {
  const linea = h.lineas.find((l) => l.id === e.lineaId);
  const cuenta = h.cuentas.find((k) => k.id === e.cuentaId);
  if (linea === undefined || linea.deudorId === null) return false;
  if (cuenta === undefined || (cuenta.tipo !== 'efectivo' && cuenta.tipo !== 'tarjeta'))
    return false;
  const medio = h.efectos
    .filter((f) => f.transaccionId === linea.transaccionId)
    .map((f) => h.cuentas.find((k) => k.id === f.cuentaId))
    .filter((k) => k?.tipo === 'efectivo' || k?.tipo === 'tarjeta')
    .at(-1);
  const t = medio?.tipo === 'tarjeta' ? medio.id : null;
  return !(cuenta.tipo === 'efectivo' && t !== null && h.categorias.some((x) => x.tarjetaId === t));
}

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
  resolver: (_tx, e, h) => {
    if (e.asignarAPagoTarjeta === true && casillaSinPropuesta(h, e))
      throw new ErrorValidacion(
        'asignarAPagoTarjeta',
        'Solo podés asignar a la tarjeta un cobro en efectivo de algo que pagaste con ella.',
      );
    return Promise.resolve(e);
  },
  comando: (e, instante, ids) => ({
    operacion: 'OP-31',
    ...altaDe(e, instante, ids),
    lineaId: e.lineaId,
    cuentaId: e.cuentaId,
    ...(e.asignarAPagoTarjeta === undefined ? {} : { asignarAPagoTarjeta: e.asignarAPagoTarjeta }),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
