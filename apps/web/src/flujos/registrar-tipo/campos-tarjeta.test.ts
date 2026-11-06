// Los campos de `/registrar/entrada-tarjeta`, `/avance` y `/transferencia-deuda` (FT-32): el contrato del formulario y la entrada de OP-27
// que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op27 } from '@finn/aplicacion/contratos';
import {
  aEntradaDeAccion,
  contratoDe,
  TIPOS,
  tipoDeTarjeta,
  valoresIniciales,
  type Campos,
} from './campos-tarjeta';

const ID = '00000000-0000-4000-8000-000000000001';
const T = '00000000-0000-4000-8000-0000000000a1';
const U = '00000000-0000-4000-8000-0000000000b2';
const E = '00000000-0000-4000-8000-0000000000c3';
const con = (extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-15', undefined),
  ...extra,
});

describe('PRU-DOM-TX', () => {
  it('PRU-DOM-TX-442 [CA-32.1] la entrada a una tarjeta lleva la modalidad entrada, la tarjeta, la fecha y el monto normalizado, y OP-27 la acepta', () => {
    const entrada = aEntradaDeAccion('entrada-tarjeta', {
      ...con({ tarjetaId: T, total: '30,5' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada).toEqual({
      modalidad: 'entrada',
      tarjetaId: T,
      fecha: '2027-02-15',
      total: '30.5',
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op27.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-443 [CA-32.2, CA-32.3] el avance lleva la cuenta de efectivo y la transferencia de deuda la tarjeta destino; OP-27 acepta las dos y cada tipo pide sus cuentas', () => {
    const avance = aEntradaDeAccion('avance', {
      ...con({ tarjetaId: T, cuentaId: E, total: '200' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(avance).toMatchObject({ modalidad: 'avance', tarjetaId: T, cuentaId: E, total: '200' });
    const deuda = aEntradaDeAccion('transferencia-deuda', {
      ...con({ tarjetaId: T, tarjetaDestinoId: U, total: '100' }),
      modo: 'previsualizar',
      id: ID,
    });
    expect(deuda).toMatchObject({
      modalidad: 'transferencia_deuda',
      tarjetaId: T,
      tarjetaDestinoId: U,
    });
    for (const e of [avance, deuda]) {
      const { modo, ...sinModo } = e;
      expect(modo).toBeDefined();
      expect(op27.safeParse(sinModo).success).toBe(true);
    }
    const faltan = (tipo: Parameters<typeof contratoDe>[0]) => {
      const r = contratoDe(tipo).safeParse(con({ total: '10' }));
      return r.success ? [] : r.error.issues.map((i) => i.path[0]);
    };
    expect(faltan('entrada-tarjeta')).toEqual(['tarjetaId']);
    expect(faltan('avance')).toEqual(['tarjetaId', 'cuentaId']);
    expect(faltan('transferencia-deuda')).toEqual(['tarjetaId', 'tarjetaDestinoId']);
  });

  it('PRU-DOM-TX-444 [CA-32.4] la URL del flujo se traduce al tipo de formulario y cualquier otra no es de la ficha', () => {
    expect(TIPOS['entrada-tarjeta'].formulario).toBe('entrada_tarjeta');
    expect(TIPOS['transferencia-deuda'].formulario).toBe('transferencia_deuda');
    expect(tipoDeTarjeta('avance')).toBe('avance');
    expect(tipoDeTarjeta('ingreso')).toBeUndefined();
    expect(tipoDeTarjeta('gasto')).toBeUndefined();
  });
});
