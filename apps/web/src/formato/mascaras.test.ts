// Máscaras de los campos v3 (C-45, C-41; docs/anexos/finn-campos-v3/CAMPOS-V3.md §5): solo texto, como `logica/motor.js`.
import { describe, expect, it } from 'vitest';
import { normalizarMontoEscrito } from '../formularios/normalizar-monto';
import {
  completarDecimales,
  conMiles,
  enmascararFecha,
  enmascararMonto,
  enmascararPorcentaje,
} from './index';

describe('PRU-DOM-VAL máscaras de los campos v3', () => {
  it('PRU-DOM-VAL-820 [C-45, C-41] monto: dígitos y un punto, 2 decimales, sin ceros a la izquierda, 9 enteros y comas solo en la vista', () => {
    expect(enmascararMonto('1236.456')).toBe('1236.45');
    expect(enmascararMonto('1,236.4')).toBe('1236.4');
    expect(enmascararMonto('$ 00012a3')).toBe('123');
    expect(enmascararMonto('.5')).toBe('0.5');
    expect(enmascararMonto('1.2.3')).toBe('1.23');
    expect(enmascararMonto('1234567890123')).toBe('123456789');
    expect(conMiles('1236.45')).toBe('1,236.45');
    expect(conMiles('25000000')).toBe('25,000,000');
    expect(conMiles('1236.')).toBe('1,236.');
    expect(conMiles('')).toBe('');
    expect(completarDecimales('1236.4')).toBe('1236.40');
    expect(completarDecimales('1236')).toBe('1236.00');
    expect(completarDecimales('0.')).toBe('0.00');
    expect(completarDecimales('')).toBe('');
    // El valor sin comas es el texto que ya entiende la normalización de 05 §5.2: lo que se envía no cambia.
    expect(normalizarMontoEscrito(completarDecimales('1236.4'))).toEqual({
      estado: 'valido',
      texto: '1236.40',
      esCero: false,
    });
    expect(normalizarMontoEscrito(enmascararMonto('25,000,000'))).toEqual({
      estado: 'invalido',
      motivo: 'demasiado_grande',
    });
  });

  it('PRU-DOM-VAL-821 [C-45, C-41] porcentaje de hasta 3 enteros sin separador y fecha con las barras solas', () => {
    expect(enmascararPorcentaje('1005')).toBe('100');
    expect(enmascararPorcentaje('14,55%')).toBe('145');
    expect(enmascararPorcentaje('14.555')).toBe('14.55');
    expect(enmascararPorcentaje('007')).toBe('7');
    expect(enmascararFecha('15102026')).toBe('15/10/2026');
    expect(enmascararFecha('1510')).toBe('15/10');
    expect(enmascararFecha('15/1a0/20269')).toBe('15/10/2026');
    expect(enmascararFecha('2026-10-15')).toBe('15/10/2026');
  });
});
