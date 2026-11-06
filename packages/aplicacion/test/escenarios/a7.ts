// SEM-A7 como estado inicial para las E2E de `apps/web` (que no importan valores del dominio, 04 §1.3): los pasos de la semilla
// (07 §12.4) más el paso 3 de 06 §4.2 aplanados en operaciones, cada una con el día de su paso. Es el estado de A.7 publicado.
// Sin las confirmaciones del banco (OP-30): el ejecutor `int` no registra las etiquetas técnicas de los saldos iniciales y la
// confirmación no entra en ningún número de los reportes de ritmo.
import estadoA7, { paso3SuperSelectos } from '../../../dominio/escenarios/semillas/estado-a7.ts';
import type { Escenario, Op } from '../../../dominio/escenarios/tipos.ts';

export function escenarioA7(): Escenario {
  return {
    id: 'SEM-A7-E2E',
    titulo: 'A.7 después del paso 3 de 4.2',
    refs: [],
    hoy: estadoA7.hoy,
    estadoInicial: [...estadoA7.pasos, paso3SuperSelectos].flatMap((p) =>
      p.ops
        .filter((op) => op.op !== 'OP-30')
        .map((op): Op => ({ ...op, hoy: op.hoy ?? p.hoy }) as Op),
    ),
    pasos: [],
  };
}
