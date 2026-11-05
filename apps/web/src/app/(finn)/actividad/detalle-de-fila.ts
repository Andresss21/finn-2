// Lo que la fila de la lista de Actividad dice además del comercio (export 02): el ícono del tipo y «cuenta · categoría», «cuenta ·
// 3 partes» o «origen → destino». Son nombres y un conteo de líneas del DTO; ningún monto (PF-3).
import type { TransaccionFila } from '@finn/dominio/selectores';
import type { DetalleDeFila } from '../../../componentes/dominio/fila-transaccion';
import { actividad as t } from '../../../textos/actividad';

export function detalleDeFila(f: TransaccionFila): DetalleDeFila {
  const nombres = f.cuentas.map((c) => c.cuenta.nombre);
  if (f.cuentas.length > 1) {
    const salida = f.cuentas.find((c) => c.monto < 0)?.cuenta.nombre ?? nombres[0] ?? '';
    const entrada = f.cuentas.find((c) => c.cuenta.nombre !== salida)?.cuenta.nombre ?? '';
    return { subtitulo: `${salida} → ${entrada}`, icono: 'swap' };
  }
  const cuenta = nombres[0] ?? '';
  const una = f.lineas.length === 1 ? f.lineas[0]?.destino.nombre : undefined;
  const resto = una ?? (f.lineas.length > 1 ? t.partes(f.lineas.length) : undefined);
  return {
    subtitulo: resto === undefined ? cuenta : `${cuenta} · ${resto}`,
    icono: f.montoPresentado > 0 ? 'in' : 'out',
  };
}
