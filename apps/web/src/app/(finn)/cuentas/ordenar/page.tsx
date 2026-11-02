// `/cuentas/ordenar` (05 §2.7, FT-53): ordenar las cuentas abiertas (OP-03). Es un flujo corto.
import type { Metadata } from 'next';
import { LectorCuentasOrdenar } from '../../../../flujos/cuentas-ordenar/lector';
import { cuentasGestion } from '../../../../textos/cuentas-gestion';

export const metadata: Metadata = { title: cuentasGestion.ordenar.titulo };

export default function PaginaCuentasOrdenar() {
  return <LectorCuentasOrdenar />;
}
