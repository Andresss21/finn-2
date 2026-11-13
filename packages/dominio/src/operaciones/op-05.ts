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
  // [CH-254] Una activa no tiene fecha de archivo (ck_*_archivada_el); las archivadas antes de la migración no la traen.
  const sinFecha = (x: { readonly archivadaEl?: unknown }) =>
    (x.archivadaEl ?? null) === null ? abrir : { ...abrir, archivadaEl: null };
  const cambios: Cambio[] = [
    { tipo: 'actualizar', tabla: 'cuentas', id: k.id, campos: sinFecha(k) },
  ];
  if (pago !== undefined)
    cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: pago.id, campos: sinFecha(pago) });
  return { cambios };
}
