// PRU-ESC-nn@motor (prototipo de V7-08): un `it` por escenario, una aserción por fila.
import { describe, it, expect } from 'vitest';
import { ESCENARIOS } from './todos';
import { correr } from './ejecutar';
import { ejecutorMotor } from './motor';
describe('PRU-ESC@motor', () => {
  for (const [id, e] of ESCENARIOS) {
    it(`PRU-${id}@motor [${id}${e.refs.length ? ', ' + e.refs.join(', ') : ''}] ${e.titulo}`, async () => {
      const filas = await correr(id, ESCENARIOS, ejecutorMotor as any);
      for (const f of filas) { if (f.omitidos.length) console.log(`${id} paso ${f.paso}: omitido ${f.omitidos.join(', ')}`); expect.soft(f.fallos, `${id} paso ${f.paso}`).toEqual([]); }
    });
  }
});
