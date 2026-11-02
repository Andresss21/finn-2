// Los campos de `/registrar/ingreso` y `/registrar/transferencia` (FT-22, FT-23): el contrato del formulario y la entrada de
// OP-21 y OP-22 que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op21, op22 } from '@finn/aplicacion/contratos';
import {
  aEntradaDeAccion,
  contratoDe,
  tipoDeRegistro,
  valoresIniciales,
  type Campos,
} from './campos';

const ID = '00000000-0000-4000-8000-000000000001';
const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b2';
const con = (extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-05', undefined),
  ...extra,
});

describe('PRU-DOM-TX', () => {
  it('PRU-DOM-TX-371 [CA-22.1] la entrada de un ingreso lleva la cuenta, la fecha, el monto normalizado y la descripción como comercio, y OP-21 la acepta', () => {
    const payload = {
      ...con({ cuentaId: A, total: '1000,5', descripcion: ' Salario ' }),
      modo: 'confirmar',
      id: ID,
    };
    const entrada = aEntradaDeAccion('ingreso', payload);
    expect(entrada).toEqual({
      cuentaId: A,
      comercio: 'Salario',
      fecha: '2027-02-05',
      total: '1000.5',
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op21.safeParse(sinModo).success).toBe(true);
    // sin descripción no se envía comercio
    expect(aEntradaDeAccion('ingreso', { ...payload, descripcion: '  ' })).not.toHaveProperty(
      'comercio',
    );
  });

  it('PRU-DOM-TX-371 [CA-23.1] la entrada de una transferencia lleva origen, destino, fecha y monto, sin descripción, y OP-22 la acepta', () => {
    const entrada = aEntradaDeAccion('transferencia', {
      ...con({ origenId: A, destinoId: B, total: '200', descripcion: 'no va' }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada).toEqual({
      origenId: A,
      destinoId: B,
      fecha: '2027-02-05',
      total: '200',
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op22.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-371 el contrato exige la cuenta, la fecha y un monto escrito completo; el de la transferencia exige las dos cuentas', () => {
    const rutas = (tipo: 'ingreso' | 'transferencia', c: Campos): string[] => {
      const r = contratoDe(tipo).safeParse(c);
      return r.success ? [] : r.error.issues.map((i) => String(i.path[0])).sort();
    };
    expect(rutas('ingreso', con({}))).toEqual(['cuentaId', 'total']);
    expect(rutas('ingreso', con({ cuentaId: A, total: '10' }))).toEqual([]);
    expect(rutas('ingreso', con({ cuentaId: A, total: '', fecha: '' }))).toEqual([
      'fecha',
      'total',
    ]);
    expect(rutas('transferencia', con({ total: '10' }))).toEqual(['destinoId', 'origenId']);
    expect(rutas('transferencia', con({ origenId: A, destinoId: A, total: '10' }))).toEqual([]);
  });

  it('PRU-DOM-TX-371 solo `ingreso` y `transferencia` son de este flujo y la fecha inicial es el hoy del servidor', () => {
    expect(tipoDeRegistro('ingreso')).toBe('ingreso');
    expect(tipoDeRegistro('transferencia')).toBe('transferencia');
    expect(tipoDeRegistro('gasto')).toBeUndefined();
    expect(valoresIniciales('2027-02-05', A)).toMatchObject({
      fecha: '2027-02-05',
      cuentaId: A,
      origenId: A,
      destinoId: '',
    });
  });
});
