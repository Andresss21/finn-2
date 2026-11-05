import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { verificarInvariantes } from '../invariantes';
import { hechosArb } from '../pruebas/generadores';
import { FechaLocal } from '../valores/fecha-local';
import { calcular } from './calcular';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1) y
// FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const HOY = FechaLocal.desdeTexto('2027-09-30');
/** Cuántos días puede avanzar el reloj sin ninguna operación: cruza varios cierres (01 §7.3). */
const AVANCE_MAXIMO = 150;

/** Un "hoy" posterior a los hechos: el reloj simulado de 04 §13.1.4 avanza y los períodos se cierran solos. */
const casoArb = fc.tuple(hechosArb(HOY), fc.integer({ min: 0, max: AVANCE_MAXIMO }));

describe('PRU-PROP-PRES', () => {
  it('PRU-PROP-PRES-300 [CA-16.7, inv. 1, inv. 28] para cualquier estado y cualquier «hoy», con el reloj avanzando sin operaciones, la identidad de saldo y 0 ≤ SobT ≤ sobregiro total se cumplen', () => {
    fc.assert(
      fc.property(casoArb, ([hechos, dias]) => {
        const hoy = FechaLocal.sumarDias(HOY, dias);
        const i = calcular(hechos, hoy);
        const falladas = verificarInvariantes(i).filter(
          (x) => x.invariante === 1 || x.invariante === 28,
        );
        expect(falladas).toEqual([]);
      }),
      opciones,
    );
  }, 60_000);
});
