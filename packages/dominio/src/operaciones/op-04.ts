// OP-04 Archivar cuenta (01 §5.1, §7.7; 04 §3.1): saldo 0; una tarjeta, además, sin deuda ni
// Disponible en pago(t), y se archiva con ella. Sus asignaciones futuras vuelven a LPA si se aceptó.
import type { Cambio, ComandoOp04, Instantanea, Rechazo } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { buscarCuenta, pagoDe } from './op-01';
import { esRechazo } from './rechazos';

export function op04(antes: Instantanea, x: ComandoOp04): Efecto | Rechazo {
  const { hechos: h } = antes;
  const k = buscarCuenta(h, x.cuentaId);
  if (esRechazo(k)) return k;
  const cuentaId = k.id;
  if (k.archivada) return { codigo: 'cuenta_ya_archivada', datos: { cuentaId } };
  const t = antes.tarjetas.find((y) => y.tarjetaId === cuentaId);
  if (t !== undefined && t.deuda > 0)
    return { codigo: 'tarjeta_con_deuda', datos: { cuentaId, deuda: t.deuda } };
  const saldo = antes.cuentas.find((y) => y.cuentaId === cuentaId)?.saldo ?? Centavos.cero;
  if (saldo !== 0) return { codigo: 'cuenta_con_saldo', datos: { cuentaId, saldo } };
  const pago = pagoDe(h, cuentaId);
  const cambios: Cambio[] = [];
  if (t !== undefined && pago !== undefined) {
    const disponible = t.disponibleDePago;
    if (disponible !== 0)
      return { codigo: 'reserva_tarjeta_no_cero', datos: { cuentaId, disponible } };
    const activo = antes.presupuesto.activo.inicio;
    const futuras = h.asignaciones.filter(
      (a) => a.categoriaId === pago.id && a.periodoInicio > activo && a.monto !== 0,
    );
    if (futuras.length > 0 && x.devolverAsignacionesFuturas !== true) {
      const suma = futuras.reduce((s, a) => Centavos.sumar(s, a.monto), Centavos.cero);
      return { codigo: 'reserva_tarjeta_no_cero', datos: { cuentaId, futuras: suma } };
    }
    for (const a of futuras) cambios.push({ tipo: 'eliminar', tabla: 'asignaciones', id: a.id });
  }
  const archivar = { archivada: true };
  cambios.push({ tipo: 'actualizar', tabla: 'cuentas', id: cuentaId, campos: archivar });
  if (pago !== undefined)
    cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: pago.id, campos: archivar });
  return { cambios };
}
