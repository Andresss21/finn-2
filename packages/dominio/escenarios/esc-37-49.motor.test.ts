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

it('PRU-ESC-37@motor [ESC-37, N8, F2, O5, B-3] Meta anual: reparto y renovación con dinero no gastado', () =>
  verificar('ESC-37'));
it('PRU-ESC-38@motor [ESC-38, O5, A-4] Meta para una fecha: cumplida antes, vencida y extendida', () =>
  verificar('ESC-38'));
it('PRU-ESC-39@motor [ESC-39, H6, P3] Cuota de préstamo con desglose', () => verificar('ESC-39'));
it('PRU-ESC-42@motor [ESC-42, O4, N4] Fusión que afecta sobregiros de períodos cerrados', () =>
  verificar('ESC-42'));
it('PRU-ESC-43@motor [ESC-43, O3, F1] Eliminación de una tarjeta con asignaciones en un período cerrado', () =>
  verificar('ESC-43'));
it('PRU-ESC-44@motor [ESC-44, H10, M3, N5] Archivar una categoría y devolución posterior hacia ella', () =>
  verificar('ESC-44'));
it('PRU-ESC-46@motor [ESC-46, P5, P18] SMS de las 7 pm del día 20 aprobado el día 21', () =>
  verificar('ESC-46'));
it('PRU-ESC-47@motor [ESC-47, P12, N6] Conciliación con diferencia y edición posterior', () =>
  verificar('ESC-47'));
it('PRU-ESC-48@motor [ESC-48, Q7, Q3, N9] Cobro de un por cobrar con débito depositado en la tarjeta', () =>
  verificar('ESC-48'));
it('PRU-ESC-49@motor [ESC-49, Q1, C1, C3] Tres períodos seguidos con asignaciones futuras', () =>
  verificar('ESC-49'));
