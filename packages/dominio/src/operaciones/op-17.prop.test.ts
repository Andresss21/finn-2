import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { ciclo, periodoDe } from '../calculo/periodos';
import { fechaArb, hechosArb } from '../pruebas/generadores';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

let aceptadas = 0;
describe('PRU-DOM-PRES-120: OP-17 y la invariante 19', () => {
  it('PRU-DOM-PRES-120 [CA-13.4, INV-19] con cualquier estado, después de auto-asignar en el período activo o en un futuro Listo para asignar no queda negativo; si ya lo era, no cambia ninguna asignación', () => {
    fc.assert(
      fc.property(
        fechaArb(FechaLocal.desdePartes(2027, 12, 31)).chain((hoy) =>
          fc.tuple(fc.constant(hoy), hechosArb(hoy), fc.integer({ min: 0, max: 3 })),
        ),
        ([hoy, hechos, adelante]) => {
          const c = ciclo(hechos.vigencias_ciclo);
          let p = periodoDe(c, hoy);
          for (let k = 0; k < adelante; k++) p = periodoDe(c, FechaLocal.sumarDias(p.fin, 1));
          let n = 0;
          const antes = calcular(hechos, hoy).lpa.total;
          const r = aplicar(
            hechos,
            {
              operacion: 'OP-17',
              periodoInicio: p.inicio,
              ids: { siguiente: () => `n${++n}` as never },
            },
            hoy,
          );
          // Un rechazo (período no editable, categorías sin metas…) no cambia nada y no es lo que se prueba.
          if (!r.ok) return;
          aceptadas++;
          const despues = calcular(r.hechosNuevos, hoy).lpa.total;
          if (antes >= 0) expect(despues).toBeGreaterThanOrEqual(0);
          else expect(r.cambios).toEqual([]);
        },
      ),
      opciones,
    );
    expect(aceptadas).toBeGreaterThan(0);
  });
});
