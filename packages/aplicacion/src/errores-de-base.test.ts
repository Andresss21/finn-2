// Traducción de rechazos de la base a errores (04 §7.4; BE-24, BE-25).
import { describe, expect, it } from 'vitest';
import { errorDeBase } from './errores-de-base.ts';

const envuelto = (originalCode: string, codigo = 'P2039'): unknown => ({
  code: codigo,
  meta: { driverAdapterError: { cause: { originalCode } } },
});

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-153 BE-24, BE-25: un rechazo de la base es INTERNO con referencia y el bloqueo es OCUPADO', () => {
    const interno = errorDeBase(envuelto('FN003'), 'E-7K2QPX');
    expect(interno).toEqual({
      categoria: 'INTERNO',
      codigo: 'FN003',
      mensaje: 'Algo salió mal y no se guardó nada. Referencia: E-7K2QPX.',
      idError: 'E-7K2QPX',
    });
    expect(errorDeBase(envuelto('23505', 'P2002'), 'E-1')?.categoria).toBe('INTERNO');
    expect(errorDeBase({ cause: { originalCode: '23514' } }, 'E-1')?.codigo).toBe('23514');
    expect(errorDeBase(envuelto('55P03'), 'E-1')?.categoria).toBe('OCUPADO');
    expect(errorDeBase(envuelto('40P01'), 'E-1')?.mensaje).toContain('Intentá de nuevo');
    expect(errorDeBase(new Error('boom'), 'E-1')).toBeNull();
  });
});
