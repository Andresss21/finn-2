// OP-31 Cobrar (01 §5.5, §4.10; 04 §3.5; P9, D1, O1, N9, Q3, Q7): una transacción `cobro` vinculada a
// la línea por cobrar, con +C en una cuenta de efectivo o tarjeta. Restitución, excedente, pago
// implícito y dinero en camino los deriva `porCobrar`. Con `asignarAPagoTarjeta` (BE-36), la misma
// operación asigna R a pago(t) en el activo con las reglas de OP-14. Fecha, archivo e inv. 9 a 12
// los verifica `aplicar`.
import { calcular } from '../calculo/calcular';
import { porCobrar } from '../calculo/por-cobrar';
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { aplicarCambios } from './comunes';
import { pagoDe } from './op-01';
import { buscar } from './op-07';
import { asignado, op14 } from './op-14';
import { alta, cuentaDe } from './op-20';
import { esRechazo, rechazo } from './rechazos';

type R = H.Rechazo;

export function op31(antes: H.Instantanea, x: H.ComandoOp31): Efecto | R {
  const { hechos: h } = antes;
  const l = buscar(h.lineas, x.lineaId, 'lineas');
  if (esRechazo(l)) return l;
  const compra = antes.porCobrar.find((y) => y.lineaId === l.id);
  if (compra === undefined) return { codigo: 'linea_no_es_por_cobrar', datos: { lineaId: l.id } };
  const k = cuentaDe(h, x.cuentaId, 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  if (x.fecha < compra.fecha) return rechazo('evento_anterior_a_original', { fecha: compra.fecha });
  // B-7, CB-23: el saldo abierto con los eventos hasta la fecha del cobro.
  const abierto = porCobrar(h, x.fecha).find((y) => y.lineaId === l.id)?.abierto ?? Centavos.cero;
  if (abierto <= 0)
    return { codigo: 'sin_saldo_abierto', datos: { lineaId: l.id, fecha: x.fecha } };

  const [tx, ...efectos] = alta(x, 'cobro', [{ cuentaId: k.id, monto: x.total }]);
  const fila = { ...(tx as { readonly fila: H.Transaccion }).fila, lineaCobradaId: l.id };
  const cambios: H.Cambio[] = [{ tipo: 'insertar', tabla: 'transacciones', fila }, ...efectos];

  // AV-22 (O1): R de un por cobrar con tarjeta t que entra en efectivo se propone para pago(t).
  const t = compra.medio.tarjetaId;
  const pago = t !== null && k.tipo === 'efectivo' ? pagoDe(h, t) : undefined;
  if (pago === undefined || t === null) {
    if (x.asignarAPagoTarjeta === true)
      throw new TypeError(`OP-31 ${x.id}: asignarAPagoTarjeta sin propuesta AV-22`);
    return { cambios };
  }
  const R = Centavos.min(x.total, abierto);
  const periodoInicio = antes.presupuesto.activo.inicio;
  if (x.asignarAPagoTarjeta !== true) {
    const datos = { categoriaId: pago.id, tarjetaId: t, periodoInicio, monto: R };
    return {
      cambios,
      avisos: [{ codigo: 'AV-22', momento: 'despues', requiereConfirmacion: false, datos }],
    };
  }
  // BE-36: OP-14 sobre el estado con el cobro, para que AV-11 vea la entrada de R a LPA.
  let conCobro: H.Instantanea;
  try {
    conCobro = calcular(aplicarCambios(h, cambios), antes.hoy);
  } catch (e) {
    // Un cobro que el motor no puede calcular lo rechaza `aplicar` (inv. 9).
    if (!(e instanceof RangeError)) throw e;
    return { cambios };
  }
  const montoNuevo = Centavos.sumar(asignado(antes, pago.id, periodoInicio), R);
  const r = op14(conCobro, {
    operacion: 'OP-14',
    categoriaId: pago.id,
    periodoInicio,
    montoNuevo,
    ids: x.ids,
  });
  if (esRechazo(r)) return r;
  return { ...r, cambios: [...cambios, ...r.cambios] };
}
