import { describe, expect, it } from 'vitest';
import { Centavos } from './index';

const c = Centavos.desdeEntero;

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-101 [H11, ESC-36, ESC-37] Centavos (ADR-15): constructores, operaciones y los dos redondeos con aritmética entera', () => {
    // Constructores: solo enteros seguros.
    expect(c(0)).toBe(0);
    expect(c(-123_450)).toBe(-123_450);
    expect(c(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    for (const malo of [0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])
      expect(() => c(malo)).toThrow(RangeError);
    expect(Centavos.cero).toBe(0);

    // Texto decimal sin flotantes (04 §13.3): montoTexto y montoTextoConSigno.
    expect(Centavos.desdeTexto('1234.50')).toBe(123_450);
    expect(Centavos.desdeTexto('1234.5')).toBe(123_450);
    expect(Centavos.desdeTexto('1234')).toBe(123_400);
    expect(Centavos.desdeTexto('0.07')).toBe(7);
    expect(Centavos.desdeTexto('-1234.50')).toBe(-123_450);
    expect(Centavos.desdeTexto('21474836.47')).toBe(2_147_483_647);
    expect(Centavos.desdeTexto('0.29')).toBe(29); // 0.29 * 100 = 28.999… con flotantes
    expect(Object.is(Centavos.desdeTexto('-0.00'), 0)).toBe(true);
    for (const malo of ['', '1.234', '.5', '1.', '+1', '123456789', '1,00', ' 1', '1e3', '--1'])
      expect(() => Centavos.desdeTexto(malo)).toThrow(RangeError);

    // Suma, resta, negación, mín, máx y comparación.
    expect(Centavos.sumar(c(22_143), c(-7_857))).toBe(14_286);
    expect(Centavos.restar(c(50_000), c(22_143))).toBe(27_857);
    expect(() => Centavos.sumar(c(Number.MAX_SAFE_INTEGER), c(1))).toThrow(RangeError);
    expect(() => Centavos.restar(c(-Number.MAX_SAFE_INTEGER), c(1))).toThrow(RangeError);
    expect(Centavos.negar(c(9_231))).toBe(-9_231);
    expect(Object.is(Centavos.negar(Centavos.cero), 0)).toBe(true);
    expect(Centavos.min(c(5), c(-3))).toBe(-3);
    expect(Centavos.min(c(-3), c(5))).toBe(-3);
    expect(Centavos.max(c(5), c(-3))).toBe(5);
    expect(Centavos.max(c(-3), c(5))).toBe(5);
    expect(Centavos.comparar(c(1), c(2))).toBe(-1);
    expect(Centavos.comparar(c(2), c(1))).toBe(1);
    expect(Centavos.comparar(c(2), c(2))).toBe(0);

    // Meta semanal, mitad hacia arriba (ESC-36: 50 por semana).
    const semanal = c(5_000);
    expect(Centavos.metaSemanalDelPeriodo(semanal, 31)).toBe(22_143); // 221.428…
    expect(Centavos.metaSemanalDelPeriodo(semanal, 28)).toBe(20_000);
    expect(Centavos.metaSemanalDelPeriodo(semanal, 30)).toBe(21_429); // 214.285…
    expect(Centavos.metaSemanalDelPeriodo(semanal, 11)).toBe(7_857); // 78.571…
    // La mitad exacta sube: 1 × 7 / 14 = 0.5 → 1; 3 × 7 / 14 = 1.5 → 2.
    expect(Centavos.metaSemanalDelPeriodo(c(1), 7)).toBe(1);
    expect(Centavos.metaSemanalDelPeriodo(c(1), 3)).toBe(0);
    expect(Centavos.metaSemanalDelPeriodo(c(1), 4)).toBe(1);
    expect(Centavos.metaSemanalDelPeriodo(Centavos.cero, 31)).toBe(0);
    expect(() => Centavos.metaSemanalDelPeriodo(c(-1), 7)).toThrow(RangeError);
    expect(() => Centavos.metaSemanalDelPeriodo(semanal, 0)).toThrow(RangeError);
    expect(() => Centavos.metaSemanalDelPeriodo(semanal, 1.5)).toThrow(RangeError);
    expect(() => Centavos.metaSemanalDelPeriodo(c(Number.MAX_SAFE_INTEGER), 2)).toThrow(RangeError);

    // Metas de ahorro, techo (ESC-37: 1,200 entre 13 y 1,107.69 entre 12).
    expect(Centavos.cuotaConTecho(c(120_000), 13)).toBe(9_231); // 92.307…
    expect(Centavos.cuotaConTecho(c(110_769), 12)).toBe(9_231); // 92.3075
    expect(Centavos.cuotaConTecho(c(10_000), 1)).toBe(10_000);
    expect(Centavos.cuotaConTecho(c(60_000), 12)).toBe(5_000);
    expect(Centavos.cuotaConTecho(Centavos.cero, 12)).toBe(0);
    expect(() => Centavos.cuotaConTecho(c(-1), 12)).toThrow(RangeError);
    expect(() => Centavos.cuotaConTecho(c(100), 0)).toThrow(RangeError);
    expect(() => Centavos.cuotaConTecho(c(Number.MAX_SAFE_INTEGER), 2)).toThrow(RangeError);
  });
});
