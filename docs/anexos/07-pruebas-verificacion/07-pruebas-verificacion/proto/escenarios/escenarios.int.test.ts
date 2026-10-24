// PRU-ESC-nn@int (prototipo de V7-08): los mismos archivos, contra PostgreSQL con el esquema de 03, como finn_app.
import { describe, it, expect } from 'vitest';
import { ESCENARIOS } from './todos';
import { correr } from './ejecutar';
import { ejecutorInt } from './int';
describe('PRU-ESC@int', () => {
  for (const [id, e] of ESCENARIOS) {
    it(`PRU-${id}@int [${id}${e.refs.length ? ', ' + e.refs.join(', ') : ''}] ${e.titulo}`, async () => {
      const filas = await correr(id, ESCENARIOS, ejecutorInt as any);
      for (const f of filas) { if (f.omitidos.length) console.log(`${id} paso ${f.paso}: omitido ${f.omitidos.join(', ')}`); expect.soft(f.fallos, `${id} paso ${f.paso}`).toEqual([]); }
    }, 60000);
  }
});
