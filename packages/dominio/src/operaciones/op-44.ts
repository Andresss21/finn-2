// OP-44 Omitir una ocurrencia esperada (01 §5.7, §7.8; 04 §3.7; A-6): la ocurrencia, pendiente y
// sin resolver, pasa a omitida sin transacción. Una resuelta no cambia (inv. 15).
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { ocurrenciaPendiente } from './op-43';
import { esRechazo } from './rechazos';

export function op44(antes: H.Instantanea, x: H.ComandoOp44): Efecto | H.Rechazo {
  const p = ocurrenciaPendiente(antes.hechos, x.programadaId, x.fechaEsperada);
  if (esRechazo(p)) return p;
  const fila = {
    ...{ id: x.id, programadaId: p.id, fechaEsperada: x.fechaEsperada },
    ...({ estado: 'omitida', transaccionId: null, revision: null } as const),
  };
  return { cambios: [{ tipo: 'insertar', tabla: 'ocurrencias_resueltas', fila }] };
}
