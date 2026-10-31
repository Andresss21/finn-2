import type { Centavos } from '@finn/dominio/valores';
import { describe, expect, it } from 'vitest';
import {
  centavosATextoDecimal,
  formatearFecha,
  formatearFechaTexto,
  formatearInstante,
  formatearMonto,
  formatearMontoAccesible,
  formatearMontoCsv,
  formatearMontoTexto,
  formatearPeriodo,
  formatearPeriodoCorto,
  formatearPorcentaje,
} from './index';

const c = (n: number): Centavos => n as Centavos;

// Referencia construida a mano: agrupa de a tres con comas, sin `Intl` ni división.
function referencia(n: number): string {
  const abs = String(Math.abs(n)).padStart(3, '0');
  const enteros = abs.slice(0, -2);
  let agrupado = '';
  for (let i = 0; i < enteros.length; i++) {
    if (i > 0 && (enteros.length - i) % 3 === 0) agrupado += ',';
    agrupado += enteros[i];
  }
  return `${n < 0 ? '−' : ''}$${agrupado}.${abs.slice(-2)}`;
}

describe('PRU-DOM-VAL-005 módulo de formato [V5-02]', () => {
  it('PRU-DOM-VAL-005 salidas fijadas de montos, con U+2212 al mostrar', () => {
    expect(formatearMonto(c(123450))).toBe('$1,234.50');
    expect(formatearMonto(c(-4500))).toBe('−$45.00');
    expect(formatearMonto(c(75))).toBe('$0.75');
    expect(formatearMonto(c(2147483647))).toBe('$21,474,836.47');
    expect(formatearMonto(c(0))).toBe('$0.00');
    expect(formatearMontoTexto('12.3')).toBe('$12.30');
    expect(formatearMontoTexto('-45')).toBe('−$45.00');
    expect(formatearMontoTexto('-0.00')).toBe('$0.00');
  });

  it('PRU-DOM-VAL-005 texto decimal sin flotantes y texto accesible "menos $X"', () => {
    expect(centavosATextoDecimal(c(123450))).toBe('1234.50');
    expect(centavosATextoDecimal(c(-1))).toBe('-0.01');
    expect(centavosATextoDecimal(c(0))).toBe('0.00');
    expect(formatearMontoAccesible(c(-123450))).toBe('menos $1,234.50');
    expect(formatearMontoAccesible(c(123450))).toBe('$1,234.50');
  });

  it('PRU-DOM-VAL-005 la exportación CSV sigue con el guion ASCII (CF-15)', () => {
    expect(formatearMontoCsv(c(-4500))).toBe('-45.00');
    expect(formatearMontoCsv(c(4500))).toBe('45.00');
    expect(formatearMontoCsv(c(-4500))).not.toContain('−');
  });

  it('PRU-DOM-VAL-005 400.000 montos coinciden con la referencia construida a mano', () => {
    const malCerca: number[] = [];
    for (let n = -100_000; n < 100_000; n++) {
      if (formatearMonto(c(n)) !== referencia(n)) malCerca.push(n);
    }
    expect(malCerca).toEqual([]);
    // 200.000 pseudoaleatorios en todo el rango, con una congruencia lineal de semilla fija (sin reloj ni azar).
    let x = 20_261_029;
    const malLejos: number[] = [];
    for (let i = 0; i < 200_000; i++) {
      x = (Math.imul(x, 1_103_515_245) + 12_345) >>> 0;
      const n = (x % 4_294_967_295) - 2_147_483_647;
      if (formatearMonto(c(n)) !== referencia(n)) malLejos.push(n);
    }
    expect(malLejos).toEqual([]);
  });

  it('PRU-DOM-VAL-005 fechas, períodos, instantes y porcentajes fijados', () => {
    expect(formatearFecha('2026-10-05')).toBe('05/10/2026');
    expect(formatearFechaTexto('2026-10-05')).toBe('5 oct 2026');
    expect(formatearFechaTexto('2026-09-21')).toBe('21 sep 2026');
    const p = { inicio: '2026-09-21', fin: '2026-10-20' };
    expect(formatearPeriodo(p)).toBe('21/09/2026 – 20/10/2026');
    expect(formatearPeriodoCorto(p)).toBe('21 sep – 20 oct 2026');
    expect(formatearInstante('2026-10-05T20:32:00Z')).toBe('05/10/2026 14:32');
    expect(formatearPorcentaje(4550)).toBe('45.5%');
    expect(formatearPorcentaje(10000)).toBe('100%');
  });
});
