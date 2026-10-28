// PRU-ESC-nn@motor (07 §2.1, §12.3): una prueba por escenario, una aserción por fila (títulos literales: los lee la matriz).
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

it('PRU-ESC-40@motor [ESC-40, H13] Desembolso de préstamo y retiro de inversión', () =>
  verificar('ESC-40'));
it('PRU-ESC-41@motor [ESC-41, P3] Aporte a inversión', () => verificar('ESC-41'));
it('PRU-ESC-45@motor [ESC-45, M5, Q5, B-2] Cambio de ciclo con período de transición', () =>
  verificar('ESC-45'));
it('PRU-ESC-50@motor [ESC-50, P17, B-12, inv. 15] Registro automático atrasado e idempotente', () =>
  verificar('ESC-50'));
