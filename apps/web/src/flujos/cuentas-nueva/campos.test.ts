// Los campos de `/cuentas/nueva` (FT-50): el contrato del formulario y la entrada de OP-01 que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op01 } from '@finn/aplicacion/contratos';
import { cuentaSubtipo } from '../../textos/cuenta-subtipo';
import {
  CAMPOS_DE_TIPO,
  CONTRATO,
  aEntradaDeAccion,
  avisoDeNombreRepetido,
  conBanco,
  entradaDeOp01,
  nombrePropuesto,
  valoresIniciales,
  visible,
  type Campos,
  type TipoCuenta,
} from './campos';

const con = (tipo: TipoCuenta, extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-05', tipo),
  ...extra,
});
const ID = '00000000-0000-4000-8000-000000000001';
const N = cuentaSubtipo.nombres;

describe('PRU-DOM-CTA', () => {
  it('PRU-DOM-CTA-106 [CA-50.1, CB-28] la entrada de un ahorro y la de una tarjeta que debe pasan por el contrato de OP-01; la deuda va positiva y a favor, negativa', () => {
    const ahorro = entradaDeOp01(con('efectivo', { nombre: ' Ahorro ', saldo: '1000,5' }));
    expect(ahorro).toEqual({
      tipo: 'efectivo',
      nombre: 'Ahorro',
      subtipoEfectivo: 'corriente', // [CH-229] la interfaz lo envía siempre en efectivo
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

  it('PRU-DOM-CTA-107 el color de la tarjeta y el modelo del préstamo se envían como OP-01 los acepta y, sin elegir, se omiten', () => {
    const tarjeta = con('tarjeta', {
      nombre: 'T',
      saldo: '0',
      limiteCredito: '1500',
      diaCorte: '15',
      diaPago: '5',
    });
    expect(entradaDeOp01({ ...tarjeta, color: 'ninguno' })).not.toHaveProperty('color');
    expect(entradaDeOp01(tarjeta)).toMatchObject({ color: '#7E6638' }); // [CH-225] empieza en oro
    const oro = entradaDeOp01({ ...tarjeta, color: '#7E6638' });
    expect(oro).toMatchObject({ color: '#7E6638' });
    expect(op01.safeParse({ ...oro, id: ID }).success).toBe(true);

    const prestamo = con('prestamo', {
      nombre: 'Carro',
      saldo: '5000',
      contraparte: 'Banco',
      montoOriginal: '8000',
      cuotaPactada: '250',
      plazoCuotas: '36',
      cuotasPagadasAlCrear: '10',
    });
    expect(entradaDeOp01(prestamo)).not.toHaveProperty('modeloCalculo');
    // [CH-264] el modelo calcula con la tasa: va con ella
    const modelo = entradaDeOp01({
      ...prestamo,
      modeloCalculo: 'banco_agricola',
      tasaNominalAnual: '12',
    });
    expect(modelo).toMatchObject({ modeloCalculo: 'banco_agricola' });
    expect(op01.safeParse({ ...modelo, id: ID }).success).toBe(true);
  });

  it('PRU-DOM-CTA-813 [CA-50.3] con el modelo Banco Agrícola el préstamo envía en OP-01 el seguro del primer mes y la comisión; sin modelo no se muestran ni se envían (CH-261)', () => {
    const prestamo = con('prestamo', {
      nombre: 'Préstamo',
      saldo: '3934.62',
      contraparte: 'Banco Agrícola',
      montoOriginal: '6295',
      cuotaPactada: '377.98',
      plazoCuotas: '18',
      cuotasPagadasAlCrear: '6',
      tasaNominalAnual: '8.25',
      seguroPrimerMes: '5',
      comision: '62.95',
    });
    const seguro = CAMPOS_DE_TIPO.prestamo.find((x) => x.n === 'seguroPrimerMes');
    expect(seguro !== undefined && visible(seguro, prestamo)).toBe(false);
    expect(entradaDeOp01(prestamo)).not.toHaveProperty('seguroPrimerMes');
    expect(entradaDeOp01(prestamo)).not.toHaveProperty('comision');
    const agricola = { ...prestamo, modeloCalculo: 'banco_agricola' };
    expect(seguro !== undefined && visible(seguro, agricola)).toBe(true);
    const entrada = entradaDeOp01(agricola);
    expect(entrada).toMatchObject({
      modeloCalculo: 'banco_agricola',
      seguroPrimerMes: '5',
      comision: '62.95',
      cuotasPagadasAlCrear: 6,
    });
    expect(op01.safeParse({ ...entrada, id: ID }).success).toBe(true);
  });

  it('PRU-DOM-CTA-833 [CA-50.3] OP-01 rechaza el modelo Banco Agrícola sin tasa, con el mensaje en el campo de la tasa; con una institución elegida «Quién te prestó» no se muestra ni se envía y OP-01 lo acepta; sin institución es obligatorio (CH-264, CH-265)', () => {
    const usuario = con('prestamo', {
      nombre: 'Préstamo BA',
      saldo: '3934.62',
      contraparte: 'Banco Agrícola',
      fechaApertura: '2026-05-08',
      montoOriginal: '6295',
      cuotaPactada: '377.98',
      plazoCuotas: '18',
      cuotasPagadasAlCrear: '6',
      modeloCalculo: 'banco_agricola',
    });
    const sinTasa = op01.safeParse({ ...entradaDeOp01(usuario), id: ID });
    expect(sinTasa.error?.issues.map((i) => i.path.join('.'))).toEqual(['tasaNominalAnual']);
    const conTasa = entradaDeOp01({ ...usuario, tasaNominalAnual: '8.25' });
    expect(op01.safeParse({ ...conTasa, id: ID }).success).toBe(true);

    const contraparte = CAMPOS_DE_TIPO.prestamo.find((x) => x.n === 'contraparte');
    const conInstitucion = { ...usuario, tasaNominalAnual: '8.25', institucionId: ID };
    expect(contraparte !== undefined && visible(contraparte, conInstitucion)).toBe(false);
    expect(contraparte !== undefined && visible(contraparte, usuario)).toBe(true);
    const entrada = entradaDeOp01(conInstitucion);
    expect(entrada).not.toHaveProperty('contraparte');
    expect(entrada).toMatchObject({ institucionId: ID });
    expect(CONTRATO.safeParse({ ...conInstitucion, contraparte: '' }).success).toBe(true);
    expect(op01.safeParse({ ...entrada, id: ID }).success).toBe(true);

    const sinNadie = { ...usuario, tasaNominalAnual: '8.25', contraparte: '' };
    const formulario = CONTRATO.safeParse(sinNadie);
    expect(formulario.error?.issues.map((i) => i.path.join('.'))).toEqual(['contraparte']);
    const servidor = op01.safeParse({ ...entradaDeOp01(sinNadie), id: ID });
    expect(servidor.error?.issues.map((i) => i.path.join('.'))).toEqual(['contraparte']);
  });

  it('PRU-DOM-CTA-106 [CA-50.4]el formulario avisa antes de enviar si el nombre de la tarjeta ya se usa, sin distinguir mayúsculas, y distingue la archivada', () => {
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

  it('PRU-DOM-CTA-400 [CA-50.1] el subtipo propone el nombre sin pisar lo escrito, y una billetera no envía institución ni últimos 4', () => {
    expect(con('efectivo', {}).ultimos4).toBe('');
    expect(con('efectivo', {}).institucionId).toBe('ninguna');
    expect(con('tarjeta', {}).nombre).toBe('');
    expect(nombrePropuesto(N, 'Cuenta corriente', 'efectivo', 'ahorro')).toBe('Cuenta de ahorro');
    expect(nombrePropuesto(N, '', 'efectivo', 'billetera')).toBe('Billetera');
    expect(nombrePropuesto(N, 'Mi caja', 'efectivo', 'ahorro')).toBeUndefined();
    expect(nombrePropuesto(N, 'Billetera', 'tarjeta', 'billetera')).toBe('');
    expect(nombrePropuesto(N, 'Billetera', 'efectivo', 'billetera')).toBeUndefined();

    const billetera = con('efectivo', {
      subtipoEfectivo: 'billetera',
      nombre: 'Billetera',
      saldo: '40',
      institucionId: ID,
      ultimos4: '3310',
    });
    expect(conBanco(billetera)).toBe(false);
    const entrada = entradaDeOp01(billetera);
    expect(entrada).toMatchObject({ subtipoEfectivo: 'billetera' });
    expect(entrada).not.toHaveProperty('institucionId');
    expect(entrada).not.toHaveProperty('ultimos4');
    expect(op01.safeParse({ ...entrada, id: ID }).success).toBe(true);
    // Fuera de efectivo no va el subtipo: OP-01 lo rechazaría.
    expect(entradaDeOp01(con('inversion', { nombre: 'Fondo', saldo: '1' }))).not.toHaveProperty(
      'subtipoEfectivo',
    );
  });
});
