import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type { Hechos, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { ultimoCierre } from './cierre';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Ciclo mensual (día 1). `ef` recibe 1000 el 01/02. En marzo, `super` tiene 100 asignados y gasta 150: al cerrar queda
 * SobD = 50 (01 §4.6). Dos metas para fecha sin fondos: una vence en febrero y otra en marzo.
 */
function hechos(): Hechos {
  const mov = (tx: string, tipo: string, fecha: string, monto: number, categoria?: string) => ({
    transaccion: {
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: tx === 'si' ? '1' : '2',
      estadoBancario: 'confirmada',
      comercio: null,
      total: c(Math.abs(monto)),
      lineaCobradaId: null,
    },
    efecto: {
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id('ef'),
      monto: c(monto),
      interes: null,
      seguro: null,
    },
    lineas:
      categoria === undefined
        ? []
        : [
            {
              id: id(`l-${tx}`),
              transaccionId: id(tx),
              orden: 1,
              monto: c(Math.abs(monto)),
              categoriaId: id(categoria),
              deudorId: null,
              lineaOriginalId: null,
            },
          ],
  });
  const movs = [
    mov('si', 'saldo_inicial', '2027-02-01', 1000),
    mov('g', 'gasto', '2027-03-10', -150, 'super'),
  ];
  const categoria = (n: string, orden: number) => ({
    id: id(n),
    grupoId: id('g1'),
    nombre: n,
    orden,
    clase: 'normal',
    tarjetaId: null,
    archivada: false,
  });
  const meta = (n: string, fechaObjetivo: string) => ({
    id: id(`m-${n}`),
    categoriaId: id(n),
    tipo: 'para_fecha',
    modo: null,
    monto: c(500),
    fechaObjetivo: f(fechaObjetivo),
    fechaCreacion: f('2027-01-01'),
  });
  return {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [{ id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false }],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    grupos: [{ id: id('g1'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null }],
    categorias: [categoria('super', 1), categoria('feb', 2), categoria('mar', 3)],
    asignaciones: [
      { id: id('a1'), categoriaId: id('super'), periodoInicio: f('2027-03-01'), monto: c(100) },
    ],
    deudores: [],
    transacciones: movs.map((m) => m.transaccion),
    efectos: movs.map((m) => m.efecto),
    lineas: movs.flatMap((m) => m.lineas),
    condonaciones: [],
    metas: [meta('feb', '2027-02-20'), meta('mar', '2027-03-20')],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  } as unknown as Hechos;
}

describe('ultimoCierre', () => {
  it('PRU-DOM-PRES-105 [AV-17] el último período cerrado: su reducción de LPA, las metas que vencieron en él y los anteriores, del más reciente al más antiguo (BE-51)', () => {
    expect(ultimoCierre(calcular(hechos(), f('2027-04-15')))).toEqual({
      inicio: '2027-03-01',
      fin: '2027-03-31',
      reduccion: c(50),
      metasVencidas: 1,
      anteriores: ['2027-02-01'],
    });
  });

  it('PRU-DOM-PRES-105 con varios períodos atrasados toma el más reciente; ahí no hay reducción ni metas', () => {
    expect(ultimoCierre(calcular(hechos(), f('2027-05-15')))).toEqual({
      inicio: '2027-04-01',
      fin: '2027-04-30',
      reduccion: Centavos.cero,
      metasVencidas: 0,
      anteriores: ['2027-03-01', '2027-02-01'],
    });
  });

  it('PRU-DOM-PRES-105 sin un período cerrado devuelve null', () => {
    expect(ultimoCierre(calcular(hechos(), f('2027-02-15')))).toBeNull();
  });
});
