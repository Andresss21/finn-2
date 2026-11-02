// Propiedad de la barra de gastado (FT-09 CA-09.13): para cualquier estado y período, en cada fila de Presupuesto
// `excedenteBp > 0` si y solo si hay sobregiro, con el tipo del `SobregiroDto`; `cubiertoBp ≥ 0` y la suma ≤ 10,000.
import fc from 'fast-check';
import { expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { hechosArb } from '../pruebas/generadores';
import { FechaLocal } from '../valores/fecha-local';
import { presupuesto } from './presupuesto';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR y FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};
const HOY = FechaLocal.desdeTexto('2027-12-31');

it('PRU-PROP-PRES-101 [CA-09.13] el excedente de la barra existe si y solo si hay sobregiro, con su tipo, y el cubierto nunca es negativo ni pasa de 10,000 con el excedente', () => {
  fc.assert(
    fc.property(hechosArb(HOY), (hechos) => {
      const i = calcular(hechos, HOY);
      for (const periodo of i.presupuesto.periodos) {
        const p = presupuesto(i, periodo.inicio);
        const filas = [...p.grupos.flatMap((g) => g.categorias), ...p.archivadasConDinero];
        for (const f of filas) {
          if (f.barra === null) {
            expect(f.sobregiro).toBeNull();
            continue;
          }
          expect(f.barra.excedenteBp > 0).toBe(f.sobregiro !== null);
          expect(f.barra.tipoExcedente).toBe(f.sobregiro?.tipo ?? null);
          expect(f.barra.cubiertoBp).toBeGreaterThanOrEqual(0);
          expect(f.barra.cubiertoBp + f.barra.excedenteBp).toBeLessThanOrEqual(10_000);
        }
      }
    }),
    opciones,
  );
});
