import { describe, expect, it } from 'vitest';
import {
  aplicarSigno,
  faltaRepartir,
  filtrarTecleo,
  limpiarPegado,
  normalizarMontoEscrito,
  sumarMontosEscritos,
  type ResultadoMonto,
} from './normalizar-monto';

const valido = (texto: string, esCero = false): ResultadoMonto => ({
  estado: 'valido',
  texto,
  esCero,
});
const invalido = (motivo: 'max_dos_decimales' | 'mas_de_un_separador' | 'demasiado_grande') =>
  ({ estado: 'invalido', motivo }) as const;

describe('PRU-DOM-VAL-004 normalización de EntradaMonto', () => {
  // 22 casos de la tabla de 05 §5.2 (V5-01).
  const tabla: readonly [string, ResultadoMonto][] = [
    ['', { estado: 'vacio' }],
    ['.', { estado: 'incompleto' }],
    [',', { estado: 'incompleto' }],
    ['5', valido('5')],
    ['5.', valido('5')],
    ['5,', valido('5')],
    [',75', valido('0.75')],
    ['.75', valido('0.75')],
    ['12,3', valido('12.3')],
    ['12.34', valido('12.34')],
    ['0045,10', valido('45.10')],
    ['1,234', invalido('max_dos_decimales')],
    ['1.234', invalido('max_dos_decimales')],
    ['1.2.3', invalido('mas_de_un_separador')],
    ['1,2,3', invalido('mas_de_un_separador')],
    ['123456789', invalido('demasiado_grande')],
    ['21474836.48', invalido('demasiado_grande')],
    ['99999999', invalido('demasiado_grande')],
    ['21474836.47', valido('21474836.47')],
    ['21474836', valido('21474836')],
    ['0', valido('0', true)],
    ['0,00', valido('0', true)],
  ];

  it.each(tabla)('PRU-DOM-VAL-004 [V5-01] normaliza %j', (escrito, esperado) => {
    expect(normalizarMontoEscrito(escrito)).toEqual(esperado);
  });

  it('PRU-DOM-VAL-004 [V5-01] al teclear descarta todo lo que no sea dígito, punto o coma', () => {
    expect(filtrarTecleo('-12a,3$ 4')).toBe('12,34');
    expect(filtrarTecleo('−5')).toBe('5');
    expect(filtrarTecleo('')).toBe('');
  });

  // Casos de pegado (V5-01).
  const pegados: readonly [string, boolean, { texto: string; negativo: boolean }][] = [
    ['$1,234.50', true, { texto: '1234.50', negativo: false }],
    ['1.234,50', true, { texto: '1234.50', negativo: false }],
    ['USD 1,234,567', true, { texto: '1234567', negativo: false }],
    ['US$ 12,5', true, { texto: '12,5', negativo: false }],
    ['1,234', true, { texto: '1,234', negativo: false }],
    ['-45.00', true, { texto: '45.00', negativo: true }],
    ['(45,00)', true, { texto: '45,00', negativo: true }],
    ['−$45.00', true, { texto: '45.00', negativo: true }],
    ['–45', true, { texto: '45', negativo: true }],
    ['-45.00', false, { texto: '45.00', negativo: false }],
  ];

  it.each(pegados)('PRU-DOM-VAL-004 [V5-01] limpia el pegado %j (conSigno=%j)', (t, c, e) => {
    expect(limpiarPegado(t, c)).toEqual(e);
  });

  it('PRU-DOM-VAL-004 [V5-01] el signo se antepone al texto, nunca a un cero', () => {
    expect(aplicarSigno('45.10', 'negativo')).toBe('-45.10');
    expect(aplicarSigno('45.10', 'positivo')).toBe('45.10');
    expect(aplicarSigno('0', 'negativo')).toBe('0');
    expect(aplicarSigno('0.00', 'negativo')).toBe('0.00');
  });

  it('PRU-DOM-VAL-004 [V5-01] la única suma del cliente: suma de líneas y cuánto falta repartir (PF-3)', () => {
    expect(sumarMontosEscritos(['10.50', '0,75', '3'])).toBe(1425);
    expect(sumarMontosEscritos(['10', ''])).toBe(1000);
    expect(sumarMontosEscritos(['10', '1.234'])).toBeUndefined();
    expect(faltaRepartir('100', ['30.10', '20'])).toBe(4990);
    expect(faltaRepartir('100', ['120'])).toBe(-2000);
    expect(faltaRepartir('', ['1'])).toBeUndefined();
  });
});
