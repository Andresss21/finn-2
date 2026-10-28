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

it('PRU-ESC-21@motor [ESC-21, I4] Compartido con débito: condonación a una categoría sin Disponible', () =>
  verificar('ESC-21'));
it('PRU-ESC-23@motor [ESC-23, H8, I4] Compartido con tarjeta: cobro parcial y condonación', () =>
  verificar('ESC-23'));
it('PRU-ESC-25@motor [ESC-25, H7] Devolución total con débito en un período posterior', () =>
  verificar('ESC-25'));
it('PRU-ESC-26@motor [ESC-26, N2, D-1] Devolución parcial con tarjeta en el mismo período, compra parcialmente cubierta', () =>
  verificar('ESC-26'));
it('PRU-ESC-27@motor [ESC-27, Q2a, H3] Devolución con tarjeta en el mismo período que cubre otra compra', () =>
  verificar('ESC-27'));
it('PRU-ESC-28@motor [ESC-28, Q2b, N2, Q4, AV-06, AV-08] Devolución con tarjeta en un período posterior y saldo a favor', () =>
  verificar('ESC-28'));
it('PRU-ESC-29@motor [ESC-29, I5, inv. 9] Devolución sobre una línea por cobrar y excedente repartido', () =>
  verificar('ESC-29'));
it('PRU-ESC-30@motor [ESC-30, P10, D-4, D-2] Devolución sin compra original', () =>
  verificar('ESC-30'));
