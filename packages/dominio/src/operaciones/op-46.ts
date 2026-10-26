// OP-46 Agregar desde el estado (01 §5.8, 04 §3.8; R8, A-3): una acción explícita por movimiento que
// ejecuta el alta elegida con la fecha del movimiento y origen `importada` (estado `confirmada`, PT).
// Reclasifica con los hechos del momento (04 §9.5): un movimiento que ya coincide con una transacción
// no se agrega otra vez, y el alta tiene que dejar en la cuenta el monto del movimiento.
import type * as H from '../hechos';
import { clasificarConciliacion } from '../selectores/conciliacion';
import type { Efecto, Manejador } from './aplicar';
import { esRechazo } from './rechazos';

export function op46(
  antes: H.Instantanea,
  x: H.ComandoOp46,
  ejecutar: Manejador<H.AltaDesdeEstado>,
): Efecto | H.Rechazo {
  const m = x.estado.movimientos.find((y) => y.indice === x.movimientoIndice);
  if (m === undefined)
    throw new TypeError(`OP-46: movimiento ${x.movimientoIndice} fuera de la carga`);
  const movimientoIndice = m.indice;
  const par = clasificarConciliacion(antes, x.cuentaId, x.estado).coincidencias.find(
    (p) => p.movimientoIndice === movimientoIndice,
  );
  if (par !== undefined)
    return {
      codigo: 'coincidencia_no_valida',
      datos: { movimientoIndice, transaccionId: par.transaccionId },
    };
  const alta = { ...x.alta, fecha: m.fecha, origen: 'importada' } as const;
  const efecto = ejecutar(antes, alta);
  if (esRechazo(efecto)) return efecto;
  const deja = efecto.cambios.some(
    (c) =>
      c.tipo === 'insertar' &&
      c.tabla === 'efectos' &&
      c.fila.transaccionId === alta.id &&
      c.fila.cuentaId === x.cuentaId &&
      c.fila.monto === m.monto,
  );
  return deja ? efecto : { codigo: 'coincidencia_no_valida', datos: { movimientoIndice } };
}
