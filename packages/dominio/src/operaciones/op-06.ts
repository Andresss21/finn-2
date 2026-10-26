// OP-06 Eliminar cuenta (01 §5.1, §7.7; 04 §3.1): solo con su saldo inicial y sin programadas. Una
// tarjeta se lleva pago(t) con sus asignaciones de todos los períodos, también los cerrados (F1).
// Orden de 03 §4.6.4; siempre se confirma (AV-15).
import type { Cambio, ComandoOp06, Instantanea, Rechazo, TablaEscribible, Uuid } from '../hechos';
import type { Efecto } from './aplicar';
import { buscarCuenta, pagoDe } from './op-01';
import { esRechazo } from './rechazos';

const AV15 = { codigo: 'AV-15', momento: 'antes', requiereConfirmacion: true } as const;

const eliminar = (tabla: TablaEscribible, id: Uuid): Cambio => ({ tipo: 'eliminar', tabla, id });

export function op06(antes: Instantanea, x: ComandoOp06): Efecto | Rechazo {
  const { hechos: h } = antes;
  const k = buscarCuenta(h, x.cuentaId);
  if (esRechazo(k)) return k;
  const cuentaId = k.id;
  const propias = new Set(
    h.efectos.filter((e) => e.cuentaId === cuentaId).map((e) => e.transaccionId),
  );
  const txs = h.transacciones.filter((t) => propias.has(t.id));
  if (txs.some((t) => t.tipo !== 'saldo_inicial'))
    return { codigo: 'cuenta_con_movimientos', datos: { cuentaId } };
  const usa = (p: { cuentaId: Uuid; cuentaDestinoId: Uuid | null }) =>
    p.cuentaId === cuentaId || p.cuentaDestinoId === cuentaId;
  const n = h.programadas.filter(usa).length;
  if (n > 0) return { codigo: 'cuenta_con_programadas', datos: { cuentaId, n } };
  const pago = pagoDe(h, cuentaId);
  const asignaciones = h.asignaciones.filter(
    (a) => pago !== undefined && a.categoriaId === pago.id,
  );
  const cambios: Cambio[] = [
    ...asignaciones.map((a) => eliminar('asignaciones', a.id)),
    ...txs.map((t) => eliminar('transacciones', t.id)),
    { tipo: 'eliminarConciliacionesDeCuenta', cuentaId },
    ...(pago === undefined ? [] : [eliminar('categorias', pago.id)]),
    eliminar('cuentas', cuentaId),
  ];
  // Los Δ de LPA y de S(t) van en el impacto; el aviso nombra lo que se elimina con la cuenta.
  const conciliaciones = h.conciliaciones.filter((y) => y.cuentaId === cuentaId).length;
  const datos = { cuentaId, ...(pago !== undefined && { categoriaId: pago.id }), conciliaciones };
  return { cambios, avisos: [{ ...AV15, datos }], operacionDeclarada: 'eliminar_cuenta' };
}
