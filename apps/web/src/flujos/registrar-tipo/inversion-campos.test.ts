// Los campos de `/registrar/{aporte,retiro,ajuste}-inversion` (FT-57): el contrato del formulario y la entrada de OP-25 que sale de
// lo escrito. Los rechazos de negocio (`retiro_mayor_que_valor`…) son del servidor y los cubre la E2E.
import { describe, expect, it } from 'vitest';
import { op25 } from '@finn/aplicacion/contratos';
import {
  aEntradaDeAccion,
  contratoDe,
  tipoDeFormulario,
  tipoDeInversion,
  valoresIniciales,
  type Campos,
} from './inversion-campos';

const ID = '00000000-0000-4000-8000-000000000001';
const INV = '00000000-0000-4000-8000-0000000000a1';
const EFE = '00000000-0000-4000-8000-0000000000b2';
const CAT = '00000000-0000-4000-8000-0000000000c3';
const con = (extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-10', undefined, undefined),
  ...extra,
});

describe('PRU-DOM-TX', () => {
  it('PRU-DOM-TX-520 la entrada de un aporte lleva inversión, cuenta, categoría, fecha y monto normalizado, y OP-25 la acepta', () => {
    const entrada = aEntradaDeAccion('aporte-inversion', {
      ...con({ inversionId: INV, cuentaId: EFE, categoriaId: CAT, total: '200,5' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada).toEqual({
      modalidad: 'aporte',
      inversionId: INV,
      cuentaId: EFE,
      categoriaId: CAT,
      fecha: '2027-02-10',
      total: '200.5',
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op25.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-520 el retiro lleva la cuenta que recibe y no la categoría, y OP-25 la acepta', () => {
    const entrada = aEntradaDeAccion('retiro-inversion', {
      ...con({ inversionId: INV, cuentaId: EFE, categoriaId: CAT, total: '1000' }),
      id: ID,
    });
    expect(entrada).not.toHaveProperty('categoriaId');
    expect(entrada).toMatchObject({ modalidad: 'retiro', cuentaId: EFE, total: '1000' });
    expect(op25.safeParse(entrada).success).toBe(true);
  });

  it('PRU-DOM-TX-520 el ajuste lleva el signo en el total y ninguna cuenta, y OP-25 acepta +75.60 y −75.60', () => {
    const sube = aEntradaDeAccion('ajuste-inversion', {
      ...con({ inversionId: INV, cuentaId: EFE, total: '75.60' }),
      id: ID,
    });
    const baja = aEntradaDeAccion('ajuste-inversion', {
      ...con({ inversionId: INV, total: '75.60', signo: 'negativo' }),
      id: ID,
    });
    expect(sube).toMatchObject({ modalidad: 'ajuste', total: '75.60' });
    expect(sube).not.toHaveProperty('cuentaId');
    expect(baja).toMatchObject({ total: '-75.60' });
    expect(op25.safeParse(sube).success).toBe(true);
    expect(op25.safeParse(baja).success).toBe(true);
  });

  it('PRU-DOM-TX-520 el contrato pide lo que cada tipo necesita y el tipo de la URL elige el del formulario', () => {
    const vacio = (t: Parameters<typeof contratoDe>[0]) =>
      contratoDe(t)
        .safeParse(con({}))
        .error?.issues.map((i) => i.path[0])
        .sort();
    expect(vacio('aporte-inversion')).toEqual(
      ['cuentaId', 'categoriaId', 'inversionId', 'total'].sort(),
    );
    expect(vacio('retiro-inversion')).toEqual(['cuentaId', 'inversionId', 'total'].sort());
    expect(vacio('ajuste-inversion')).toEqual(['inversionId', 'total'].sort());
    expect(tipoDeInversion('ingreso')).toBeUndefined();
    expect(tipoDeFormulario('retiro-inversion')).toBe('retiro_inversion');
  });
});
