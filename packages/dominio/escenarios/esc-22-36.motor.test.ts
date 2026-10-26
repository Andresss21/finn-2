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

it('PRU-ESC-22@motor [ESC-22, O1, D1] Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago', () =>
  verificar('ESC-22'));
it('PRU-ESC-24@motor [ESC-24, P10] Split y compartido en la misma compra', () =>
  verificar('ESC-24'));
it('PRU-ESC-31@motor [ESC-31, C3, P4] Transacción olvidada con débito en un período cerrado, con efecto en cascada', () =>
  verificar('ESC-31'));
it('PRU-ESC-32@motor [ESC-32, C3, C1] Transacción olvidada con tarjeta en un período cerrado', () =>
  verificar('ESC-32'));
it('PRU-ESC-33@motor [ESC-33, P4, inv. 26] Eliminación en un período cerrado que elimina un sobregiro', () =>
  verificar('ESC-33'));
it('PRU-ESC-34@motor [ESC-34, I6] Cambio de fecha que mueve la transacción de período', () =>
  verificar('ESC-34'));
it('PRU-ESC-35@motor [ESC-35, P6] Meta mensual: acumular frente a rellenar hasta', () =>
  verificar('ESC-35'));
it('PRU-ESC-36@motor [ESC-36, H11] Meta semanal en períodos de distinta duración', () =>
  verificar('ESC-36'));
