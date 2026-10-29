// PRU-ESC-nn@int (TA-188; 07 §2.1, §12.3): los mismos archivos de datos que `motor`, con las operaciones reales de
// @finn/aplicacion contra PostgreSQL como `finn_app`, una prueba por escenario y una aserción por fila (títulos literales:
// los lee la matriz). Cada escenario tiene su base clonada de la plantilla y cada fila de contraste, la suya.
import { expect, it } from 'vitest';
import { correr } from '../../../dominio/escenarios/ejecutar';
import { ESCENARIOS } from '../../../dominio/escenarios/todos';
import { ejecutorInt } from './int.ts';

const TOPE = 120_000;

async function verificar(id: string) {
  const e = ESCENARIOS.get(id);
  const filas = await correr(id, ESCENARIOS, ejecutorInt);
  expect(filas.length).toBe(e?.pasos.length);
  for (const f of filas) expect.soft(f.fallos, `${id} paso ${f.paso}`).toEqual([]);
}

it('PRU-ESC-01@int [ESC-01, P13, M1, P3] Saldos iniciales', () => verificar('ESC-01'), TOPE);
it(
  'PRU-ESC-02@int [ESC-02, M1, P4, C3] Saldo inicial con fecha en un período cerrado',
  () => verificar('ESC-02'),
  TOPE,
);
it(
  'PRU-ESC-03@int [ESC-03, H4, I1, supuesto 14] Ingreso, asignación, asignar de más y límite de futuros',
  () => verificar('ESC-03'),
  TOPE,
);
it('PRU-ESC-04@int [ESC-04, P1, H3] Compra con tarjeta cubierta', () => verificar('ESC-04'), TOPE);
it(
  'PRU-ESC-05@int [ESC-05, C1, fila 3] Compra con tarjeta no cubierta y cierre',
  () => verificar('ESC-05'),
  TOPE,
);
it(
  'PRU-ESC-06@int [ESC-06, H3] Asignación posterior que cubre el sobregiro con tarjeta',
  () => verificar('ESC-06'),
  TOPE,
);
it(
  'PRU-ESC-07@int [ESC-07, P1] Cubrir deuda sin respaldo de un período cerrado',
  () => verificar('ESC-07'),
  TOPE,
);
it('PRU-ESC-08@int [ESC-08, P8] Pago parcial con desglose', () => verificar('ESC-08'), TOPE);
it('PRU-ESC-09@int [ESC-09, P8] Pago total', () => verificar('ESC-09'), TOPE);
it(
  'PRU-ESC-10@int [ESC-10, H5, O2] Pago excedente, antes y después del cierre',
  () => verificar('ESC-10'),
  TOPE,
);
