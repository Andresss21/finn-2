// Los campos de `/cuentas/nueva` (FT-50): el contrato del formulario y la entrada de OP-01 que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op01 } from '@finn/aplicacion/contratos';
import {
  CONTRATO,
  aEntradaDeAccion,
  avisoDeNombreRepetido,
  entradaDeOp01,
  valoresIniciales,
  type Campos,
  type TipoCuenta,
} from './campos';

const con = (tipo: TipoCuenta, extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-05', tipo),
  ...extra,
});
const ID = '00000000-0000-4000-8000-000000000001';

describe('PRU-DOM-CTA', () => {
  it('PRU-DOM-CTA-106 [CA-50.1, CB-28] la entrada de un ahorro y la de una tarjeta que debe pasan por el contrato de OP-01; la deuda va positiva y a favor, negativa', () => {
    const ahorro = entradaDeOp01(con('efectivo', { nombre: ' Ahorro ', saldo: '1000,5' }));
    expect(ahorro).toEqual({
      tipo: 'efectivo',
      nombre: 'Ahorro',
      fechaApertura: '2027-02-05',
      saldo: '1000.5',
    });
    expect(op01.safeParse({ ...ahorro, id: ID }).success).toBe(true);

    const debo = con('tarjeta', {
      nombre: 'T',
      saldo: '300',
      limiteCredito: '1500',
      diaCorte: '15',
      diaPago: '5',
    });
    expect(op01.safeParse({ ...entradaDeOp01(debo), id: ID }).success).toBe(true);
    expect(entradaDeOp01(debo)).toMatchObject({ saldo: '300', diaCorte: 15, red: 'otra' });
    expect(entradaDeOp01({ ...debo, signo: 'negativo' })).toMatchObject({ saldo: '-300' });
    // El saldo cero no lleva signo (CB-28)
    expect(entradaDeOp01({ ...debo, saldo: '0', signo: 'negativo' })).toMatchObject({ saldo: '0' });
  });

  it('PRU-DOM-CTA-106 [CA-50.3] un préstamo en curso lleva sus cuotas como números y los días solo con "cada N días"', () => {
    const prestamo = con('prestamo', {
      nombre: 'Carro',
      saldo: '5000',
      contraparte: 'Banco',
      montoOriginal: '8000',
      cuotaPactada: '250',
      plazoCuotas: '36',
      cuotasPagadasAlCrear: '10',
      frecuenciaDias: '14',
      tasaNominalAnual: '12,75',
    });
    const mensual = entradaDeOp01(prestamo);
    expect(mensual).toMatchObject({ plazoCuotas: 36, cuotasPagadasAlCrear: 10 });
    expect(mensual).not.toHaveProperty('frecuenciaDias');
    expect(mensual).toMatchObject({ tasaNominalAnual: '12.75' });
    expect(op01.safeParse({ ...mensual, id: ID }).success).toBe(true);
    const cada = entradaDeOp01({ ...prestamo, frecuencia: 'cada_n_dias' });
    expect(cada).toMatchObject({ frecuencia: 'cada_n_dias', frecuenciaDias: 14 });
    expect(op01.safeParse({ ...cada, id: ID }).success).toBe(true);
  });

  it('PRU-DOM-CTA-106 [CA-50.7] el contrato del formulario exige nombre, saldo y los campos del tipo, y deja el saldo cero', () => {
    const vacio = CONTRATO.safeParse(con('tarjeta', {}));
    expect(vacio.success).toBe(false);
    const rutas = vacio.error?.issues.map((i) => i.path.join('.')) ?? [];
    expect(rutas).toEqual(
      expect.arrayContaining(['nombre', 'saldo', 'limiteCredito', 'diaCorte', 'diaPago']),
    );
    expect(rutas).not.toContain('tasaAnual');
    expect(CONTRATO.safeParse(con('efectivo', { nombre: 'Caja', saldo: '0' })).success).toBe(true);
    expect(CONTRATO.safeParse(con('efectivo', { nombre: 'Caja', saldo: '1,234' })).success).toBe(
      false,
    );
  });

  it('PRU-DOM-CTA-106 [CA-50.4] el formulario avisa antes de enviar si el nombre de la tarjeta ya se usa, sin distinguir mayúsculas, y distingue la archivada', () => {
    const usados = [
      { nombre: 'Visa Oro', archivada: true },
      { nombre: 'Master', archivada: false },
    ];
    expect(avisoDeNombreRepetido('tarjeta', 'visa oro', usados)).toBe(
      'Ya tenés una tarjeta archivada llamada Visa Oro.',
    );
    expect(avisoDeNombreRepetido('tarjeta', ' MASTER ', usados)).toBe(
      'Ya tenés una tarjeta llamada Master.',
    );
    expect(avisoDeNombreRepetido('tarjeta', 'Otra', usados)).toBeUndefined();
    expect(avisoDeNombreRepetido('tarjeta', '', usados)).toBeUndefined();
    // El nombre de una cuenta que no es tarjeta no es el de una categoría de pago
    expect(avisoDeNombreRepetido('efectivo', 'Master', usados)).toBeUndefined();
  });

  it('PRU-DOM-CTA-106 [CA-50.1] la acción recibe los campos armados como OP-01 con el modo, el id y la confirmación de useOperacion', () => {
    const campos = con('efectivo', { nombre: 'Caja', saldo: '10' });
    const payload = {
      ...campos,
      modo: 'confirmar',
      id: ID,
      revisionVista: 'r',
      huellaImpacto: 'h',
    };
    expect(aEntradaDeAccion(payload)).toMatchObject({
      tipo: 'efectivo',
      saldo: '10',
      modo: 'confirmar',
      id: ID,
      revisionVista: 'r',
      huellaImpacto: 'h',
    });
    expect(aEntradaDeAccion({ ...campos, modo: 'confirmar', id: ID })).not.toHaveProperty(
      'revisionVista',
    );
  });
});
