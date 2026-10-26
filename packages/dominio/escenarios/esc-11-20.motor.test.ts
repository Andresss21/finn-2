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

it('PRU-ESC-11@motor [ESC-11, F4] Pago excedente con deuda restante', () => verificar('ESC-11'));
it('PRU-ESC-12@motor [ESC-12, P8] Intereses y comisiones', () => verificar('ESC-12'));
it('PRU-ESC-13@motor [ESC-13, Q4, H5] Saldo a favor por pago y reserva excedente', () =>
  verificar('ESC-13'));
it('PRU-ESC-14@motor [ESC-14, Q3] Cashback, avance de efectivo y transferencia entre tarjetas', () =>
  verificar('ESC-14'));
it('PRU-ESC-15@motor [ESC-15, C1, C2] Sobregiro de débito y su efecto al cierre', () =>
  verificar('ESC-15'));
it('PRU-ESC-16@motor [ESC-16] Cubrir un sobregiro de débito antes del cierre', () =>
  verificar('ESC-16'));
it('PRU-ESC-17@motor [ESC-17, D2, C1] Sobregiro mixto el mismo día, con una transacción agregada tarde', () =>
  verificar('ESC-17'));
it('PRU-ESC-18@motor [ESC-18, C1, D2] Cambio de medio de pago', () => verificar('ESC-18'));
it('PRU-ESC-19@motor [ESC-19, P10, N3] Split entre una categoría cubierta y otra no', () =>
  verificar('ESC-19'));
it('PRU-ESC-20@motor [ESC-20, D1, N9] Compartido con débito: en camino, cobro parcial y excedente', () =>
  verificar('ESC-20'));
