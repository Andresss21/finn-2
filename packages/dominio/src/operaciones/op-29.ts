// OP-29 Eliminar transacción (01 §5.4, 04 §3.4; H9, N6, supuesto 12, A-2): sin eventos vinculados
// (CB-04). Su movimiento pasa a descartado, la ocurrencia que resolvió vuelve a pendiente y, si estaba
// conciliada, queda un cambio posterior (PC). Efectos y líneas caen en cascada; una cuenta archivada
// la rechaza `aplicar` porque cambia su saldo (A-1). Eliminar un saldo inicial equivale a saldo 0.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { av16, cambioPosterior, eventosDe } from './op-28';
import { esRechazo } from './rechazos';

export function op29(antes: H.Instantanea, x: H.ComandoOp29): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const t = buscar(h.transacciones, x.transaccionId, 'transacciones');
  if (esRechazo(t)) return t;
  const lineas = h.lineas.filter((l) => l.transaccionId === t.id);
  if (lineas.some((l) => eventosDe(h, l).fechas.length > 0))
    return { codigo: 'transaccion_con_eventos', datos: { transaccionId: t.id } };
  const descartado = { estado: 'descartado', transaccionId: null } as const;
  const cambios: H.Cambio[] = [
    ...x.movimientos
      .filter((m) => m.transaccionId === t.id)
      .map((m): H.Cambio => ({
        tipo: 'actualizar',
        tabla: 'movimientos',
        id: m.id,
        campos: descartado,
      })),
    ...h.ocurrencias_resueltas
      .filter((o) => o.transaccionId === t.id)
      .map((o): H.Cambio => ({ tipo: 'eliminar', tabla: 'ocurrencias_resueltas', id: o.id })),
  ];
  const conciliada = t.estadoBancario === 'conciliada' && t.conciliacionId !== null;
  if (conciliada) cambios.push(cambioPosterior(h, t, ['eliminacion'], x));
  cambios.push({ tipo: 'eliminar', tabla: 'transacciones', id: t.id });
  return { cambios, avisos: conciliada ? [av16(t)] : [] };
}
