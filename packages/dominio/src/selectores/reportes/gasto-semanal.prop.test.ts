import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Centavos } from '../../valores/centavos';
import { referenciasSemanales } from './gasto-semanal';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1) y
// FC_RUNS=100000 para repetir la verificación de V-22.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const MAXIMO = 2_147_483_647; // $21,474,836.47
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

describe('PRU-PROP-REP', () => {
  it('PRU-PROP-REP-001 [CA-61.5, CA-61.2, V-22] la referencia semanal suma exactamente lo asignado y nunca es negativa; con asignado negativo es 0 en todas las semanas', () => {
    const duracion = fc.oneof(fc.constantFrom(11, 28, 29, 30, 31), fc.integer({ min: 1, max: 31 }));
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAXIMO }), duracion, (asig, dur) => {
        const refs = referenciasSemanales(Centavos.desdeEntero(asig), dur);
        expect(refs).toHaveLength(Math.ceil(dur / 7));
        expect(suma(refs)).toBe(asig);
        expect(refs.every((r) => r >= 0)).toBe(true);
      }),
      opciones,
    );
    fc.assert(
      fc.property(fc.integer({ min: -MAXIMO, max: -1 }), duracion, (asig, dur) => {
        const refs = referenciasSemanales(Centavos.desdeEntero(asig), dur);
        expect(refs.every((r) => r === 0)).toBe(true);
      }),
      opciones,
    );
  });
});
