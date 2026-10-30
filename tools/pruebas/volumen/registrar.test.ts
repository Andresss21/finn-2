// Registro de los presupuestos de tiempo (07 §6.6, P7-5): qué se avisa, cuándo se fija FINN_REN_ROJO y que nada se
// ajusta solo.
import { describe, expect, it } from 'vitest';
import { avisos, evaluar, medidas, nuevoRojo, resumen } from './registrar.ts';

const int = {
  motor001: { medianaMs: 380, presupuestoMs: 500 },
  esq001: { medianaMs: 1141, presupuestoMs: null },
};
const bench = (median: number) => ({
  files: [{ groups: [{ benchmarks: [{ name: 'PRU-REN-MOTOR-101 [V-13] calcular', median }] }] }],
});

describe('registro de presupuestos de tiempo', () => {
  it('une las tres medidas con sus presupuestos de 04 §5.6', () => {
    const m = medidas(int, bench(120));
    expect(m.map((x) => [x.id, x.medianaMs, x.presupuestoMs])).toEqual([
      ['PRU-REN-MOTOR-101', 120, 150],
      ['PRU-REN-MOTOR-001', 380, 500],
      ['PRU-REN-ESQ-001', 1141, null],
    ]);
    expect(medidas(int, null)).toHaveLength(2);
  });

  it('un tiempo superado avisa y no tiene margen; el que no tiene tope solo se registra', () => {
    const es = medidas(int, bench(9000)).map(evaluar);
    expect(es.map((e) => e.superado)).toEqual([true, false, false]);
    expect(es[2]?.margen).toBeNull();
    const a = avisos(es);
    expect(a.some((x) => x.includes('PRU-REN-MOTOR-101') && x.includes('FINN_REN_ROJO'))).toBe(
      true,
    );
    expect(a.some((x) => x.includes('PRU-REN-ESQ-001'))).toBe(false);
  });

  it('con menos de 30 % de margen propone un CT y no fija el rojo', () => {
    const es = medidas(int, bench(120)).map(evaluar); // 380 de 500: 24 % de margen
    expect(es.some((e) => e.superado)).toBe(false);
    expect(avisos(es).filter((x) => x.includes('CT'))).toHaveLength(2);
  });

  it('FINN_REN_ROJO conserva la fecha mientras haya exceso y se borra al corregirse', () => {
    expect(nuevoRojo(null, true, '2026-11-02')).toBe('2026-11-02');
    expect(nuevoRojo('2026-10-30', true, '2026-11-02')).toBe('2026-10-30');
    expect(nuevoRojo('2026-10-30', false, '2026-11-02')).toBeNull();
  });

  it('las medidas de la web cuentan para el rojo y el CLS se escribe sin ms (TA-222)', () => {
    const cls = {
      id: 'PRU-REN-PWA-003',
      nombre: 'CLS',
      medianaMs: 0.2,
      presupuestoMs: 0.1,
      unidad: '',
    };
    const es = medidas({}, null, [cls]).map(evaluar);
    expect(es[0]?.superado).toBe(true);
    expect(resumen(es)).toContain('| 0.2 | ≤ 0.1 | SUPERADO');
    expect(avisos(es)[0]).toContain('mediana 0.2, presupuesto 0.1. FINN_REN_ROJO');
  });

  it('el resumen lista cada prueba con su estado', () => {
    const t = resumen(medidas(int, bench(9000)).map(evaluar));
    expect(t).toContain('| PRU-REN-MOTOR-101 |');
    expect(t).toContain('SUPERADO');
    expect(t).toContain('registrada');
  });
});
