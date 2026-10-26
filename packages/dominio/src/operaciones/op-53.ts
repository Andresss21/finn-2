// OP-53 Verificar saldo (CF-01; 04 §3.8, 06 §3.2.2): una conciliación sin estado de cuenta. El
// usuario escribe la fecha y el saldo de su banco; se registra con `modo = 'saldo'` y la diferencia
// aceptada de OP-47, y se marcan las transacciones elegidas con fecha ≤ fechaEstado. Nunca crea
// transacciones (inv. 14).
import type * as H from '../hechos';
import { candidatasDeConciliacion } from '../selectores/conciliacion';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { cuentaDe } from './op-20';
import { registrar } from './op-47';
import { esRechazo, rechazo } from './rechazos';

export function op53(antes: H.Instantanea, x: H.ComandoOp53): Efecto | H.Rechazo {
  const { hechos: h, hoy } = antes;
  const { fechaEstado } = x;
  const k = cuentaDe(h, x.cuentaId, 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  if (k.archivada) return rechazo('cuenta_archivada', { cuentaId: k.id });
  if (fechaEstado > hoy) return rechazo('fecha_posterior_a_hoy', { fecha: fechaEstado, hoy });
  if (fechaEstado < k.fechaApertura)
    return rechazo('fecha_anterior_a_apertura', { cuentaId: k.id, apertura: k.fechaApertura });
  // Con `todas`: las de la cuenta con fecha ≤ fechaEstado, pendientes o confirmadas.
  const candidatas = candidatasDeConciliacion(h, k.id, fechaEstado).map((c) => c.id as H.Uuid);
  const marcadas = 'todas' in x.marcar ? candidatas : [...new Set(x.marcar.ids)];
  for (const transaccionId of marcadas) {
    const t = buscar(h.transacciones, transaccionId, 'transacciones');
    if (esRechazo(t)) return t;
    if (t.estadoBancario === 'conciliada')
      return { codigo: 'transaccion_ya_conciliada', datos: { transaccionId } };
    if (!candidatas.includes(t.id))
      return { codigo: 'transaccion_fuera_de_verificacion', datos: { transaccionId } };
  }
  // En una tarjeta el usuario escribe la deuda en positivo, como en OP-01 (01 §0.4).
  const saldoEstado = k.tipo === 'tarjeta' ? Centavos.negar(x.saldoEstado) : x.saldoEstado;
  return registrar(antes, k, x, { fechaEstado, saldoEstado, modo: 'saldo' }, marcadas);
}
