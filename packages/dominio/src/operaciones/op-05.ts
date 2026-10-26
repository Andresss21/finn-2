// OP-05 Desarchivar cuenta (01 §5.1, §7.7; 04 §3.1): también su categoría de pago (A-1).
import type { Cambio, ComandoOp05, Instantanea, Rechazo } from '../hechos';
import type { Efecto } from './aplicar';
import { buscarCuenta, pagoDe } from './op-01';
import { esRechazo } from './rechazos';

export function op05(antes: Instantanea, x: ComandoOp05): Efecto | Rechazo {
  const k = buscarCuenta(antes.hechos, x.cuentaId);
  if (esRechazo(k)) return k;
  if (!k.archivada) return { codigo: 'cuenta_no_archivada', datos: { cuentaId: k.id } };
  const pago = pagoDe(antes.hechos, k.id);
  const abrir = { archivada: false };
  const cambios: Cambio[] = [{ tipo: 'actualizar', tabla: 'cuentas', id: k.id, campos: abrir }];
  if (pago !== undefined)
    cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: pago.id, campos: abrir });
  return { cambios };
}
