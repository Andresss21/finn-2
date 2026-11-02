// Barra de gastado de Presupuesto (CF-25; FT-09 CA-09.8 a CA-09.12). Cada estado sale de las operaciones del motor (DP-27):
// se siembra con el ejecutor `motor` y se lee con `presupuesto()`. Hoy fijo (07 §7.1).
import { describe, expect, it } from 'vitest';
import { ejecutorMotor } from '../../escenarios/motor';
import { ESCENARIOS } from '../../escenarios/todos';
import type { Escenario, Op } from '../../escenarios/tipos';
import { calcular } from '../calculo/calcular';
import { presupuesto, type FilaCategoria } from './presupuesto';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
];

/** Corre `ops` (después de `BASE`) en un paso sin expectativas y devuelve la fila de Super del período activo. */
async function filaSuper(ops: Op[]): Promise<FilaCategoria> {
  const e: Escenario = {
    id: 'ESC-BARRA',
    titulo: 'barra',
    refs: [],
    hoy: '2027-02-10',
    estadoInicial: BASE,
    pasos: [],
  };
  const s = await ejecutorMotor.iniciar(e, '2027-02-10');
  await ejecutorMotor.paso(s, { n: '1', ops, espera: {} });
  const p = presupuesto(calcular(s.hechos, s.hoy));
  const fila = p.grupos.flatMap((g) => g.categorias).find((x) => x.categoria.nombre === 'Super');
  if (fila === undefined) throw new Error('Super no aparece en Presupuesto');
  return fila;
}

describe('barra de gastado de Presupuesto', () => {
  it('PRU-DOM-PRES-107 [CA-09.8] Asignado $120.00 y un gasto con débito de $146.30: cubierto 8,202 y excedente 1,798, tipo débito', async () => {
    const f = await filaSuper([
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: 120 },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 146.3, categoria: 'Super' },
    ]);
    expect(f.barra).toEqual({ cubiertoBp: 8202, excedenteBp: 1798, tipoExcedente: 'debito' });
    expect(f.sobregiro?.tipo).toBe('debito');
  });

  it('PRU-DOM-PRES-107 [CA-09.9, ESC-17] el paso 2 de ESC-17 deja a Super con cubierto 6,667 y excedente 3,333, tipo mixto', async () => {
    const esc = ESCENARIOS.get('ESC-17') as Escenario;
    const s = await ejecutorMotor.iniciar(esc, esc.hoy ?? '2027-02-10');
    for (const paso of esc.pasos.filter((x) => x.n === '1' || x.n === '2'))
      await ejecutorMotor.paso(s, paso);
    const p = presupuesto(calcular(s.hechos, s.hoy));
    const fila = p.grupos.flatMap((g) => g.categorias).find((x) => x.categoria.nombre === 'Super');
    expect(fila?.barra).toEqual({ cubiertoBp: 6667, excedenteBp: 3333, tipoExcedente: 'mixto' });
    expect(fila?.sobregiro?.tipo).toBe('mixto');
  });

  it('PRU-DOM-PRES-107 [CA-09.10] Asignado −$20.00 sin consumos: cubierto 0 y excedente 10,000, tipo débito; nunca un cubierto negativo', async () => {
    const f = await filaSuper([
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: -20 },
    ]);
    expect(f.barra).toEqual({ cubiertoBp: 0, excedenteBp: 10_000, tipoExcedente: 'debito' });
    expect(f.sobregiro?.tipo).toBe('debito');
  });

  it('PRU-DOM-PRES-107 [CA-09.11] Asignado $50.00, gasto con débito de $80.00 y devolución en efectivo de $30.00 (D-2): sin sobregiro, cubierto 10,000 y tipo nulo', async () => {
    const f = await filaSuper([
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: 50 },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Super', etiqueta: 'C80' },
      { op: 'OP-33', monto: 30, compra: 'C80' },
    ]);
    expect(f.sobregiro).toBeNull();
    expect(f.clasificacion).not.toBe('sobregirada');
    expect(f.barra).toEqual({ cubiertoBp: 10_000, excedenteBp: 0, tipoExcedente: null });
  });

  it('PRU-DOM-PRES-107 [CA-09.12] Asignado $0.00, sin arrastre ni consumos: la barra es nula', async () => {
    const f = await filaSuper([{ op: 'OP-21', monto: 500 }]);
    expect(f.asignado).toBe(0);
    expect(f.barra).toBeNull();
  });
});
