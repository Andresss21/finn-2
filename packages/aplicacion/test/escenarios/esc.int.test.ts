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

it(
  'PRU-ESC-11@int [ESC-11, F4] Pago excedente con deuda restante',
  () => verificar('ESC-11'),
  TOPE,
);
it('PRU-ESC-12@int [ESC-12, P8] Intereses y comisiones', () => verificar('ESC-12'), TOPE);
it(
  'PRU-ESC-13@int [ESC-13, Q4, H5] Saldo a favor por pago y reserva excedente',
  () => verificar('ESC-13'),
  TOPE,
);
it(
  'PRU-ESC-14@int [ESC-14, Q3] Cashback, avance de efectivo y transferencia entre tarjetas',
  () => verificar('ESC-14'),
  TOPE,
);
it(
  'PRU-ESC-15@int [ESC-15, C1, C2] Sobregiro de débito y su efecto al cierre',
  () => verificar('ESC-15'),
  TOPE,
);
it(
  'PRU-ESC-16@int [ESC-16] Cubrir un sobregiro de débito antes del cierre',
  () => verificar('ESC-16'),
  TOPE,
);
it(
  'PRU-ESC-17@int [ESC-17, D2, C1] Sobregiro mixto el mismo día, con una transacción agregada tarde',
  () => verificar('ESC-17'),
  TOPE,
);
it('PRU-ESC-18@int [ESC-18, C1, D2] Cambio de medio de pago', () => verificar('ESC-18'), TOPE);
it(
  'PRU-ESC-19@int [ESC-19, P10, N3] Split entre una categoría cubierta y otra no',
  () => verificar('ESC-19'),
  TOPE,
);
it(
  'PRU-ESC-20@int [ESC-20, D1, N9] Compartido con débito: en camino, cobro parcial y excedente',
  () => verificar('ESC-20'),
  TOPE,
);

it(
  'PRU-ESC-22@int [ESC-22, O1, D1] Compartido con tarjeta: cobro y propuesta de asignar a la categoría de pago',
  () => verificar('ESC-22'),
  TOPE,
);
it(
  'PRU-ESC-24@int [ESC-24, P10] Split y compartido en la misma compra',
  () => verificar('ESC-24'),
  TOPE,
);
it(
  'PRU-ESC-31@int [ESC-31, C3, P4] Transacción olvidada con débito en un período cerrado, con efecto en cascada',
  () => verificar('ESC-31'),
  TOPE,
);
it(
  'PRU-ESC-32@int [ESC-32, C3, C1] Transacción olvidada con tarjeta en un período cerrado',
  () => verificar('ESC-32'),
  TOPE,
);
it(
  'PRU-ESC-33@int [ESC-33, P4, inv. 26] Eliminación en un período cerrado que elimina un sobregiro',
  () => verificar('ESC-33'),
  TOPE,
);
it(
  'PRU-ESC-34@int [ESC-34, I6] Cambio de fecha que mueve la transacción de período',
  () => verificar('ESC-34'),
  TOPE,
);
it(
  'PRU-ESC-35@int [ESC-35, P6] Meta mensual: acumular frente a rellenar hasta',
  () => verificar('ESC-35'),
  TOPE,
);
it(
  'PRU-ESC-36@int [ESC-36, H11] Meta semanal en períodos de distinta duración',
  () => verificar('ESC-36'),
  TOPE,
);
