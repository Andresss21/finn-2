// OP-49 Reprocesar un SMS con error (02 N-02 punto 2; 04 §3.6). Vuelve a ejecutar los pasos 2 a 11
// de OP-35 sobre el mismo SMS con su instante de recepción original: la ventana del autodescarte y
// la fecha por defecto se cuentan desde `sms.recibidoEn` y `sms.fechaRecepcion`, no desde el
// reproceso. El resultado actualiza el mismo movimiento (F4) y reemplaza sus líneas con orden nuevo
// (F2 + F3, BE-16). El intento nuevo de `sms_procesamientos` y su idempotencia (`intentoVisto`) los
// resuelve la aplicación, como en OP-35.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { op35 } from './op-35';

export function op49(antes: H.Instantanea, x: H.ComandoOp49): Efecto | H.Rechazo {
  const m = x.movimiento;
  if (m.smsId !== x.sms.id) throw new TypeError(`OP-49 ${m.id}: no es el movimiento del SMS`);
  if (m.estado !== 'error') return { codigo: 'sms_no_reprocesable', datos: { smsId: x.sms.id } };
  const { ids, sms, interpretacion, anteriores, reglas } = x;
  const movimientos = x.movimientos.filter((y) => y.id !== m.id);
  const comando = { ids, sms, interpretacion, anteriores, reglas, movimientos };
  const e = op35(antes, { operacion: 'OP-35', id: m.id, ...comando });

  const tabla = 'movimiento_lineas';
  let orden = Math.max(0, ...x.lineas.map((l) => l.orden));
  const cambios: H.Cambio[] = x.lineas.map((l) => ({ tipo: 'eliminar', tabla, id: l.id }));
  for (const c of e.cambios) {
    if (c.tipo !== 'insertar') continue;
    if (c.tabla === 'movimientos') {
      const { id, ...campos } = c.fila;
      cambios.unshift({ tipo: 'actualizar', tabla: 'movimientos', id, campos });
    } else if (c.tabla === tabla) {
      cambios.push({
        tipo: 'insertar',
        tabla,
        fila: { ...c.fila, orden: ++orden },
      });
    }
  }
  return { ...e, cambios };
}
