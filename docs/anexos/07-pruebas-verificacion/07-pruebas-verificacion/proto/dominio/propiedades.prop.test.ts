// PRU-PROP-MOTOR-001..005 (prototipo de V7-03): invariantes de 01 §6 como propiedades sobre el núcleo.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calcular, siguiente, fin, pago, type Hechos } from './nucleo';
import { hechosArb, FECHAS } from './generadores';
const RUNS = Number(process.env.FC_RUNS ?? 2000);
const SEMILLA = process.env.FC_SEED ? Number(process.env.FC_SEED) : undefined;
const cfg = { numRuns: RUNS, seed: SEMILLA, endOnFailure: false } as const;
const barajar = <T,>(xs: T[], k: number) => xs.map((x, i) => [((i + 1) * 2654435761 + k) % 4294967296, x] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-001 inv. 1: identidad de saldo en cualquier estado y cualquier hoy', () => {
    fc.assert(fc.property(hechosArb(), h => { const s = calcular(h); expect(s.efectivo).toBe(s.lpa + Object.values(s.disp).reduce((a, b) => a + b, 0) + s.fut + s.sobta); }), cfg);
  });
  it('PRU-PROP-MOTOR-002 inv. 28: 0 ≤ parte de tarjeta ≤ sobregiro total, en toda categoría y período', () => {
    fc.assert(fc.property(hechosArb(), h => { for (const [, k] of calcular(h).celdas) { expect(k.sobt).toBeGreaterThanOrEqual(0); expect(k.sobt).toBeLessThanOrEqual(Math.max(0, -k.disp)); } }), cfg);
  });
  it('PRU-PROP-MOTOR-003 inv. 2 y 3: deuda = R⁺ + S − RE y S·RE = 0', () => {
    fc.assert(fc.property(hechosArb(), h => { const s = calcular(h); for (const t of Object.keys(h.tarjetas)) {
      expect(s.deuda[t]).toBe(Math.max(0, s.disp[pago(t)]) + s.S[t] - s.RE[t]); expect(Math.min(s.S[t], s.RE[t])).toBe(0); } }), cfg);
  });
  it('PRU-PROP-MOTOR-004 inv. 26: el resultado no depende del orden en que se registraron los hechos', () => {
    fc.assert(fc.property(hechosArb(), fc.nat(), (h, k) => {
      const b: Hechos = { ...h, gastos: barajar(h.gastos, k), asig: barajar(h.asig, k + 1), pagos: barajar(h.pagos, k + 2), ingresos: barajar(h.ingresos, k + 3) };
      const x = calcular(h), y = calcular(b); expect({ ...y, celdas: [...y.celdas] }).toEqual({ ...x, celdas: [...x.celdas] }); }), cfg);
  });
  it('PRU-PROP-MOTOR-005 §4.15: el cierre no cambia S(t) ni la identidad (hoy = fin de A → inicio del siguiente)', () => {
    fc.assert(fc.property(hechosArb({ sinPagoFuturoSiguiente: true }), h => {
      const A = calcular(h).A, ultimo = fin(A); if (ultimo > FECHAS[FECHAS.length - 1]) return;
      const antes = calcular({ ...h, hoy: ultimo }), despues = calcular({ ...h, hoy: siguiente(A) });
      expect(despues.S).toEqual(antes.S);
      expect(despues.efectivo).toBe(despues.lpa + Object.values(despues.disp).reduce((a, b) => a + b, 0) + despues.fut + despues.sobta); }), cfg);
  });
});
