import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Hechos, Meta, TablaMotor } from '../hechos';
import { hechosArb } from '../pruebas/generadores';
import { Centavos } from '../valores/centavos';
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

const HOY = FechaLocal.desdeTexto('2027-12-31');

/** Una meta mensual por categoría normal, para que el orden de `metas` también cuente. */
function conMetas(h: Hechos): Hechos {
  const metas: Meta[] = h.categorias
    .filter((x) => x.clase === 'normal')
    .map((x, k) => ({
      id: `${x.id}m` as Meta['id'],
      categoriaId: x.id,
      tipo: 'mensual',
      modo: k % 2 === 0 ? 'acumular' : 'rellenar_hasta',
      monto: Centavos.desdeEntero(1000 * (k + 1)),
      fechaObjetivo: null,
      fechaCreacion: FechaLocal.desdeTexto('2027-01-01'),
      revision: null,
    }));
  return { ...h, metas };
}

/** Los mismos hechos con cada tabla en otro orden de inserción. */
const casoArb = hechosArb(HOY)
  .map(conMetas)
  .chain((h) => {
    const tablas = Object.keys(h) as TablaMotor[];
    const permutadas = tablas.map((t) =>
      fc.shuffledSubarray([...h[t]] as unknown[], {
        minLength: h[t].length,
        maxLength: h[t].length,
      }),
    );
    return fc.tuple(...permutadas).map((filas) => ({
      h,
      otro: Object.fromEntries(tablas.map((t, k) => [t, filas[k]])) as unknown as Hechos,
    }));
  });

const congelada = (x: unknown): boolean =>
  typeof x !== 'object' || x === null || (Object.isFrozen(x) && Object.values(x).every(congelada));

describe('PRU-PROP-MOTOR', () => {
  // Plazo propio, mismo criterio que bb312c2 (#33): en el run 40355731276 de ci.yml en main
  // (runner de GitHub, cobertura v8) tardó 7201 ms y pasó los 5 s por defecto. Mismos casos.
  it('PRU-PROP-MOTOR-105 [INV-26] los mismos hechos en cualquier orden de inserción producen la misma instantánea, congelada en profundidad (01 §4.1 conv. 1, 04 §2.4 BE-09)', () => {
    fc.assert(
      fc.property(casoArb, ({ h, otro }) => {
        const a = calcular(h, HOY);
        const b = calcular(otro, HOY);
        expect(b).toEqual(a);
        expect(JSON.stringify(b)).toBe(JSON.stringify(a));
        expect(congelada(a)).toBe(true);
      }),
      opciones,
    );
  }, 60_000);
});
