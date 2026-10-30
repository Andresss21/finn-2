// Las ocurrencias que el registro automático intenta (04 §10.2 paso 1; OP-43): las pendientes de las programadas con
// registro automático y fecha esperada ≤ hoy, en orden cronológico. La aplicación corre cada una en su `escribir()`.
import { pendientes } from '../calculo/ocurrencias';
import type { Hechos } from '../hechos';
import type { FechaLocal } from '../valores/fecha-local';

export function ocurrenciasAutomaticas(hechos: Hechos, hoy: FechaLocal) {
  const auto = new Set(hechos.programadas.filter((p) => p.registroAutomatico).map((p) => p.id));
  return pendientes(hechos, hoy, 0)
    .filter((o) => auto.has(o.programadaId))
    .map(({ programadaId, fecha: fechaEsperada }) => ({ programadaId, fechaEsperada }));
}
