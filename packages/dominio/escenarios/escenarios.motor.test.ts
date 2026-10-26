// PRU-ESC-nn@motor (07 §2.1, §12.3): un `it` por escenario, una aserción por fila.
import { describe, expect, it } from 'vitest';
import { correr } from './ejecutar';
import { ejecutorMotor } from './motor';
import { ESCENARIOS } from './todos';

describe('PRU-ESC@motor', () => {
  for (const [id, e] of ESCENARIOS) {
    const n = id.slice(4);
    const refs = [id, ...e.refs].join(', ');
    it(`PRU-ESC-${n}@motor [${refs}] ${e.titulo}`, async () => {
      const filas = await correr(id, ESCENARIOS, ejecutorMotor);
      expect(filas.length).toBe(e.pasos.length);
      for (const f of filas) expect.soft(f.fallos, `${id} paso ${f.paso}`).toEqual([]);
    });
  }
});
