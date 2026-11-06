// Los campos de `/registrar/desembolso` (FT-56): el contrato del formulario y la entrada de OP-26 que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op26 } from '@finn/aplicacion/contratos';
import {
  aEntradaDeDesembolso,
  contratoDesembolso,
  esDesembolso,
  valoresInicialesDesembolso,
  type CamposDesembolso,
} from './campos-desembolso';

const ID = '00000000-0000-4000-8000-000000000001';
const P = '00000000-0000-4000-8000-0000000000a1';
const E = '00000000-0000-4000-8000-0000000000c3';
const con = (extra: Partial<CamposDesembolso>): CamposDesembolso => ({
  ...valoresInicialesDesembolso('2027-02-10', undefined, undefined),
  ...extra,
});

describe('PRU-DOM-TX', () => {
  it('PRU-DOM-TX-520 [CA-56.1] la entrada del desembolso lleva el préstamo, la cuenta, la fecha y el monto normalizado, y OP-26 la acepta', () => {
    const entrada = aEntradaDeDesembolso({
      ...con({ prestamoId: P, cuentaId: E, total: '5000,5' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada).toEqual({
      prestamoId: P,
      cuentaId: E,
      fecha: '2027-02-10',
      total: '5000.5',
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op26.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-521 [CA-56.3] el destino viaja como cuentaId tal como lo eligió la persona: el tipo de cuenta lo decide el servidor', () => {
    const entrada = aEntradaDeDesembolso({
      ...con({ prestamoId: P, cuentaId: E, total: '10' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada['cuentaId']).toBe(E);
  });

  it('PRU-DOM-TX-522 [CA-56.1] el contrato pide préstamo, cuenta, fecha y un monto válido, y la ruta es solo /registrar/desembolso', () => {
    const r = contratoDesembolso.safeParse(con({ fecha: '' }));
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual([
      'prestamoId',
      'cuentaId',
      'fecha',
      'total',
    ]);
    expect(
      contratoDesembolso.safeParse(con({ prestamoId: P, cuentaId: E, total: '1' })).success,
    ).toBe(true);
    expect(esDesembolso('desembolso')).toBe(true);
    expect(esDesembolso('avance')).toBe(false);
  });
});
