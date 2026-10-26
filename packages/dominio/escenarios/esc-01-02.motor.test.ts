// PRU-ESC-nn@motor (07 §2.1, §12.3): una prueba por escenario, una aserción por fila. Cada tarea de escenarios agrega su
// propio archivo `*.motor.test.ts` con los títulos escritos completos (los lee la matriz con `vitest list`).
import { expect, it } from 'vitest';
import { correr } from './ejecutar';
import { ejecutorMotor } from './motor';
import { ESCENARIOS } from './todos';

async function verificar(id: string) {
  const e = ESCENARIOS.get(id);
  const filas = await correr(id, ESCENARIOS, ejecutorMotor);
  expect(filas.length).toBe(e?.pasos.length);
  for (const f of filas) expect.soft(f.fallos, `${id} paso ${f.paso}`).toEqual([]);
}

it('PRU-ESC-01@motor [ESC-01, P13, M1, P3] Saldos iniciales', () => verificar('ESC-01'));
it('PRU-ESC-02@motor [ESC-02, M1, P4, C3] Saldo inicial con fecha en un período cerrado', () =>
  verificar('ESC-02'));
