// Contrato de montos y revisión en la frontera y errores (04 §13.3, §7.1, §7.4, §7.6; BE-08, BE-24, BE-25, BE-28, BE-29).
import { describe, expect, it } from 'vitest';
import { errorDeValidacion } from '../errores/tipos.ts';
import { montoTexto, montoTextoConSigno, revision } from './comunes.ts';

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-152 BE-28, BE-29: montoTexto y montoTextoConSigno pasan de texto decimal a Centavos sin flotantes y la revisión es una cadena', () => {
    expect(montoTexto.parse('1234.50')).toBe(123_450);
    expect(montoTexto.parse('5')).toBe(500);
    expect(montoTexto.parse('0.1')).toBe(10);
    expect(montoTexto.parse('21474836.47')).toBe(2_147_483_647);
    expect(montoTextoConSigno.parse('-1234.50')).toBe(-123_450);
    expect(montoTextoConSigno.parse('-21474836.47')).toBe(-2_147_483_647);
    for (const malo of [
      '',
      '1.234',
      '1,234.50',
      '-5',
      '+5',
      '5.',
      '.5',
      '123456789',
      '1e3',
      '−5',
    ]) {
      expect(montoTexto.safeParse(malo).success, malo).toBe(false);
    }
    expect(montoTexto.safeParse('21474836.48').success).toBe(false);
    expect(montoTextoConSigno.safeParse('-21474836.48').success).toBe(false);
    expect(montoTextoConSigno.safeParse('−5').success).toBe(false);
    const r = montoTexto.safeParse('21474836.48');
    expect(r.success ? '' : r.error.issues[0]?.message).toBe(
      'El monto no puede pasar de $21,474,836.47.',
    );
    expect(revision.parse('1234')).toBe('1234');
    expect(revision.parse('9223372036854775807')).toBe('9223372036854775807');
    for (const mala of ['', '-1', '1.5', '12345678901234567890', 'abc']) {
      expect(revision.safeParse(mala).success, mala).toBe(false);
    }
    // VALIDACION (7.6): ruta unida con puntos y el primer mensaje
    const v = errorDeValidacion([
      { path: ['lineas', 2, 'monto'], message: 'uno' },
      { path: ['lineas', 2, 'monto'], message: 'dos' },
      { path: ['total'], message: 'tres' },
    ]);
    expect(v.campos).toEqual({ 'lineas.2.monto': 'uno', total: 'tres' });
    expect(v.mensaje).toBe('Revisá los campos marcados.');
  });
});
