// Los campos de `/cuentas/[cuentaId]/condiciones` (FT-55): de lo que dice el servidor a texto de formulario y de lo escrito a la
// entrada de OP-48, que solo lleva lo que cambió con lo que vio la persona.
import { describe, expect, it } from 'vitest';
import { op48 } from '@finn/aplicacion/contratos';
import { actualesDe, aEntradaDeAccion, camposDe, contratoDe, esperadoDe } from './campos';

const ID = '00000000-0000-4000-8000-000000000003';
const FILA = {
  tipo: 'prestamo',
  contraparte: 'Banco',
  montoOriginal: 1000000,
  tasaNominalAnualMillonesimas: 127525,
  tipoTasa: 'fija',
  seguroPrimerMes: null,
  comision: null,
  frecuencia: 'mensual',
  frecuenciaDias: null,
  cuotaPactada: 35000,
  plazoCuotas: 36,
  modeloCalculo: null,
};

describe('PRU-DOM-CTA', () => {
  it('PRU-DOM-CTA-300 [CA-55.3] la fila del servidor pasa a texto: centavos a decimal, millonésimas a porcentaje, vacío a vacío', () => {
    const c = camposDe(FILA);
    expect(c).toMatchObject({
      montoOriginal: '10000.00',
      cuotaPactada: '350.00',
      tasaNominalAnual: '12.7525',
      seguroPrimerMes: '',
      modeloCalculo: 'ninguno',
      plazoCuotas: '36',
    });
    expect(camposDe({ ...FILA, tasaNominalAnualMillonesimas: 120000 }).tasaNominalAnual).toBe('12');
  });

  it('PRU-DOM-CTA-301 [CA-55.3] la entrada de OP-48 lleva solo los campos que cambiaron, cada uno con lo que vio la persona, y pasa el contrato', () => {
    const visto = camposDe(FILA);
    const entrada = aEntradaDeAccion(ID, visto, {
      ...visto,
      tasaNominalAnual: '12',
      seguroPrimerMes: '5',
      cuotaPactada: '350',
      modeloCalculo: 'banco_agricola',
      modo: 'confirmar',
      esperado: esperadoDe(visto),
    });
    expect(entrada).toMatchObject({
      prestamoId: ID,
      tasaNominalAnual: '12',
      seguroPrimerMes: '5.00',
      modeloCalculo: 'banco_agricola',
      modo: 'confirmar',
    });
    expect(entrada).not.toHaveProperty('cuotaPactada'); // $350 escrito sin decimales es lo mismo que vio
    expect(entrada).not.toHaveProperty('montoOriginal');
    expect(op48.safeParse(entrada).success).toBe(true);
  });

  it('PRU-DOM-CTA-302 [CA-55.3] un dato que ya tenía valor no se puede dejar vacío y los días solo se piden con «cada N días»', () => {
    const visto = camposDe(FILA);
    const contrato = contratoDe(visto);
    const mensajes = (c: typeof visto) =>
      contrato.safeParse(c).error?.issues.map((i) => i.path[0]) ?? [];
    expect(mensajes(visto)).toEqual([]);
    expect(mensajes({ ...visto, tasaNominalAnual: '' })).toEqual(['tasaNominalAnual']);
    expect(mensajes({ ...visto, cuotaPactada: '' })).toEqual(['cuotaPactada']);
    expect(mensajes({ ...visto, frecuencia: 'cada_n_dias' })).toEqual(['frecuenciaDias']);
  });

  it('PRU-DOM-CTA-303 [CA-55.3] los «actuales» de un conflicto traen solo los campos enviados, con el nombre del contrato', () => {
    expect(actualesDe({ tasaNominalAnual: 130000, cuotaPactada: 36000 })).toEqual({
      tasaNominalAnual: '13',
      cuotaPactada: '360.00',
    });
  });
});
