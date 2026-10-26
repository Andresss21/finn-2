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

  it('PRU-DOM-VAL-103 [V6-02] Centavos.repartirPorRestoMayor (FD-19, CH-20): partes truncadas, centavos a los restos mayores con el desempate del llamador, suma exacta y productos sobre 2^53', () => {
    const alfa = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    const inverso = (a: string, b: string) => alfa(b, a);
    const pesos = (...xs: number[]) => new Map(xs.map((p, i) => [`m${i}`, c(p)] as const));
    const partes = (m: Map<string, Centavos>) => [...m.values()];
    const reparto = (monto: number, ps: Map<string, Centavos>, d = alfa) =>
      Centavos.repartirPorRestoMayor(c(monto), ps, d);

    // Resto empatado: 100 entre tres pesos iguales deja restos 1, 1, 1 y falta un centavo.
    expect(partes(reparto(100, pesos(1, 1, 1)))).toEqual([34, 33, 33]);
    expect(partes(reparto(100, pesos(1, 1, 1), inverso))).toEqual([33, 33, 34]);
    // El centavo va al resto mayor, no al peso mayor: 3 × (1, 2, 7) / 10 = 0.3, 0.6 y 2.1.
    expect(partes(reparto(3, pesos(1, 2, 7)))).toEqual([0, 1, 2]);
    // 7 × (2, 3, 5) / 10 = 1.4, 2.1 y 3.5: falta un centavo, para el resto 5.
    expect(partes(reparto(7, pesos(2, 3, 5)))).toEqual([1, 2, 4]);
    // Todas las claves, en el orden de entrada, aunque su parte sea 0; monto 0 da ceros.
    expect([...reparto(1, pesos(0, 5, 5))]).toEqual([
      ['m0', 0],
      ['m1', 1],
      ['m2', 0],
    ]);
    expect(partes(reparto(0, pesos(3, 4)))).toEqual([0, 0]);
    // Sin pesos, o con todos en 0, no hay reparto.
    expect(reparto(500, pesos(0, 0)).size).toBe(0);
    expect(reparto(500, new Map()).size).toBe(0);

    // Producto mayor que 2^53, en bigint: 1,000,000,000,007 × 1,000,000,000,039 ≈ 10^24.
    const grande = reparto(1_000_000_000_007, pesos(999_999_999_989, 1_000_000_000_039, 7));
    expect(partes(grande)).toEqual([499_999_999_989, 500_000_000_014, 4]);
    expect(partes(grande).reduce((s, x) => s + x, 0)).toBe(1_000_000_000_007);

    // Suma exacta en una grilla de montos y pesos.
    for (let monto = 0; monto <= 60; monto += 7)
      for (const ps of [pesos(1, 2, 3), pesos(5, 0, 5), pesos(9_999, 1), pesos(13, 17, 19, 23)])
        expect(partes(reparto(monto, ps)).reduce((s, x) => s + x, 0)).toBe(monto);

    expect(() => reparto(-1, pesos(1, 1))).toThrow(RangeError);
    expect(() => reparto(10, pesos(2, -1))).toThrow(RangeError);
  });
});
