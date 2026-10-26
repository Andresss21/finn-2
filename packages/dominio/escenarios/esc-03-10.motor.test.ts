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

it('PRU-ESC-03@motor [ESC-03@motor, H4, I1, supuesto 14] Ingreso, asignación, asignar de más y límite de futuros', () =>
  verificar('ESC-03'));
it('PRU-ESC-04@motor [ESC-04@motor, P1, H3] Compra con tarjeta cubierta', () =>
  verificar('ESC-04'));
it('PRU-ESC-05@motor [ESC-05@motor, C1, fila 3] Compra con tarjeta no cubierta y cierre', () =>
  verificar('ESC-05'));
it('PRU-ESC-06@motor [ESC-06@motor, H3] Asignación posterior que cubre el sobregiro con tarjeta', () =>
  verificar('ESC-06'));
it('PRU-ESC-07@motor [ESC-07@motor, P1] Cubrir deuda sin respaldo de un período cerrado', () =>
  verificar('ESC-07'));
it('PRU-ESC-08@motor [ESC-08@motor, P8] Pago parcial con desglose', () => verificar('ESC-08'));
it('PRU-ESC-09@motor [ESC-09@motor, P8] Pago total', () => verificar('ESC-09'));
it('PRU-ESC-10@motor [ESC-10@motor, H5, O2] Pago excedente, antes y después del cierre', () =>
  verificar('ESC-10'));
