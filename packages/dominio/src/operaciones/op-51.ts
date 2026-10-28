// OP-51 Eliminar una programada sin historial (04 §3.7, 03 §3.23; HZ-1): sin resoluciones ni
// referencias desde la bandeja (`programada_con_historial`). Sus líneas se van en cascada (DB-12).
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

export function op51(antes: H.Instantanea, x: H.ComandoOp51): Efecto | H.Rechazo {
  const p = buscar(antes.hechos.programadas, x.programadaId, 'programadas');
  if (esRechazo(p)) return p;
  const resueltas = antes.hechos.ocurrencias_resueltas.some((o) => o.programadaId === p.id);
  if (resueltas || x.referencias > 0)
    return { codigo: 'programada_con_historial', datos: { programadaId: p.id } };
  return { cambios: [{ tipo: 'eliminar', tabla: 'programadas', id: p.id }] };
}
