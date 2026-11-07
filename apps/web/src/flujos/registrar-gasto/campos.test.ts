// Los campos de `/registrar/gasto` (FT-21): el contrato del formulario y la entrada de OP-20 que sale de lo escrito.
import { describe, expect, it } from 'vitest';
import { op20 } from '@finn/aplicacion/contratos';
import { valoresDeUrl } from '../../formularios/valores-de-url';
import {
  aEntradaDeAccion,
  contrato,
  DEUDOR_NUEVO,
  destinoDeValor,
  deudoresReutilizados,
  parteVacia,
  textoDeAviso,
  valorDeDestino,
  valoresIniciales,
  type Campos,
  type Parte,
} from './campos';

const ID = '00000000-0000-4000-8000-000000000001';
const CUENTA = '00000000-0000-4000-8000-0000000000a1';
const SUPER = '00000000-0000-4000-8000-0000000000b2';
const MASCOTA = '00000000-0000-4000-8000-0000000000b3';
const ANA = '00000000-0000-4000-8000-0000000000c4';
const parte = (extra: Partial<Parte>): Parte => ({ ...parteVacia(), ...extra });
const con = (extra: Partial<Campos>): Campos => ({
  ...valoresIniciales('2027-02-10', CUENTA),
  ...extra,
});
const rutas = (c: Campos): string[] => {
  const r = contrato.safeParse(c);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('PRU-DOM-TX', () => {
  it('PRU-DOM-TX-376 [CA-21.1] la entrada de una compra dividida lleva el total, una parte por categoría y la cuenta, y OP-20 la acepta', () => {
    const entrada = aEntradaDeAccion({
      ...con({
        total: '150',
        comercio: ' PriceSmart ',
        lineas: [
          parte({ monto: '110', categoriaId: SUPER }),
          parte({ monto: '40,5', categoriaId: MASCOTA }),
        ],
      }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada).toEqual({
      cuentaId: CUENTA,
      fecha: '2027-02-10',
      total: '150',
      comercio: 'PriceSmart',
      lineas: [
        { monto: '110', destino: { categoriaId: SUPER } },
        { monto: '40.5', destino: { categoriaId: MASCOTA } },
      ],
      modo: 'confirmar',
      id: ID,
    });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op20.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-376 [CA-21.2] una parte por cobrar lleva un deudor existente o uno nuevo con el nombre escrito, y OP-20 acepta las dos', () => {
    const entrada = aEntradaDeAccion({
      ...con({
        total: '200',
        lineas: [
          parte({ monto: '120', categoriaId: SUPER }),
          parte({ monto: '50', destino: 'por_cobrar', deudorId: ANA }),
          parte({
            monto: '30',
            destino: 'por_cobrar',
            deudorId: DEUDOR_NUEVO,
            deudorNuevo: ' Beto ',
          }),
        ],
      }),
      modo: 'confirmar',
      id: ID,
    });
    expect(entrada['lineas']).toEqual([
      { monto: '120', destino: { categoriaId: SUPER } },
      { monto: '50', destino: { deudorId: ANA } },
      { monto: '30', destino: { deudorNuevo: 'Beto' } },
    ]);
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op20.safeParse(sinModo).success).toBe(true);
  });

  it('PRU-DOM-TX-376 [CA-21.4] un nombre escrito como deudor nuevo que ya existe, sin distinguir mayúsculas, se reconoce para decirlo en el resultado', () => {
    const c = con({
      lineas: [
        parte({ monto: '25', destino: 'por_cobrar', deudorId: DEUDOR_NUEVO, deudorNuevo: ' ana ' }),
        parte({ monto: '10', destino: 'por_cobrar', deudorId: DEUDOR_NUEVO, deudorNuevo: 'Beto' }),
      ],
    });
    const existentes = [
      { id: ANA, nombre: 'Ana' },
      { id: CUENTA, nombre: 'Carlos' },
    ];
    expect(deudoresReutilizados(c, existentes)).toEqual(['Ana']);
  });

  it('PRU-DOM-TX-376 [CA-21.6] el contrato rechaza una parte sin categoría ni deudor, y una de por cobrar sin persona ni nombre', () => {
    expect(rutas(con({ total: '10', lineas: [parte({ monto: '10' })] }))).toEqual([
      'lineas.0.categoriaId',
    ]);
    expect(
      rutas(con({ total: '10', lineas: [parte({ monto: '10', destino: 'por_cobrar' })] })),
    ).toEqual(['lineas.0.deudorId']);
    expect(
      rutas(
        con({
          total: '10',
          lineas: [parte({ monto: '10', destino: 'por_cobrar', deudorId: DEUDOR_NUEVO })],
        }),
      ),
    ).toEqual(['lineas.0.deudorNuevo']);
    expect(
      rutas(con({ total: '10', lineas: [parte({ monto: '10', categoriaId: SUPER })] })),
    ).toEqual([]);
  });

  it('PRU-DOM-TX-376 [CA-21.5] el contrato no compara la suma con el total: eso lo valida el servidor', () => {
    const c = con({
      total: '150',
      lineas: [
        parte({ monto: '110', categoriaId: SUPER }),
        parte({ monto: '39', categoriaId: MASCOTA }),
      ],
    });
    expect(rutas(c)).toEqual([]);
  });

  it('PRU-DOM-TX-376 el contrato exige la cuenta, la fecha y un total escrito completo, y pone un máximo de 20 partes', () => {
    expect(
      rutas(con({ cuentaId: '', lineas: [parte({ monto: '1', categoriaId: SUPER })] })),
    ).toEqual(['cuentaId', 'total']);
    const veintiuna = Array.from({ length: 21 }, () => parte({ monto: '1', categoriaId: SUPER }));
    expect(rutas(con({ total: '21', lineas: veintiuna }))).toEqual(['lineas']);
    expect(valoresIniciales('2027-02-10', undefined)).toMatchObject({
      fecha: '2027-02-10',
      cuentaId: '',
      lineas: [{ destino: 'categoria' }],
    });
  });

  it('PRU-DOM-TX-390 [CA-21.11] con 21 partes el contrato las rechaza en el campo de las partes antes de llegar al servidor, y con 20 las acepta', () => {
    const partes = (n: number) =>
      Array.from({ length: n }, () => parte({ monto: '1', categoriaId: SUPER }));
    expect(rutas(con({ total: '21', lineas: partes(21) }))).toEqual(['lineas']);
    expect(rutas(con({ total: '20', lineas: partes(20) }))).toEqual([]);
  });

  it('PRU-DOM-TX-440 [CA-21.2] el destino de una línea compacta es una sola selección que va y viene entre categoría, persona existente y otra persona sin perder los campos de la parte', () => {
    expect(valorDeDestino(parte({}))).toBe('');
    for (const l of [
      parte({ destino: 'categoria', categoriaId: SUPER }),
      parte({ destino: 'por_cobrar', deudorId: ANA }),
      parte({ destino: 'por_cobrar', deudorId: DEUDOR_NUEVO }),
    ])
      expect(destinoDeValor(valorDeDestino(l))).toEqual({
        destino: l.destino,
        categoriaId: l.categoriaId,
        deudorId: l.deudorId,
      });
    expect(destinoDeValor(`d:${ANA}`)).toEqual({
      destino: 'por_cobrar',
      categoriaId: '',
      deudorId: ANA,
    });
  });

  it('PRU-DOM-TX-441 [AV-07] un aviso de la previsualización se muestra con su texto del catálogo y no como el código crudo', () => {
    expect(textoDeAviso('AV-07')).toBe('La deuda de esa tarjeta queda como «Te falta reservar».');
    expect(textoDeAviso('AV-01')).toContain('período cerrado');
    expect(textoDeAviso('AV-99')).toBe('AV-99');
  });

  it('PRU-DOM-TX-542 [CA-44.3, CA-43.4] el ajuste llega a /registrar/gasto por la URL como fecha, monto y comercio, con una sola parte por el total, y un valor con otra forma se ignora', () => {
    const url = valoresDeUrl({
      fecha: '2027-02-15',
      total: '10.00',
      comercio: 'Ajuste de conciliación',
    });
    const inicial = valoresIniciales('2027-02-16', CUENTA, url);
    expect(inicial).toMatchObject({
      fecha: '2027-02-15',
      total: '10.00',
      comercio: 'Ajuste de conciliación',
      lineas: [{ monto: '10.00' }],
    });
    const completo = {
      ...inicial,
      lineas: inicial.lineas.map((l) => ({ ...l, categoriaId: SUPER })),
    };
    const entrada = aEntradaDeAccion({ ...completo, modo: 'confirmar', id: ID });
    const { modo, ...sinModo } = entrada;
    expect(modo).toBe('confirmar');
    expect(op20.safeParse(sinModo).success).toBe(true);
    const ignorado = valoresIniciales(
      '2027-02-16',
      CUENTA,
      valoresDeUrl({ fecha: 'ayer', total: '-3' }),
    );
    expect(ignorado).toMatchObject({ fecha: '2027-02-16', total: '', lineas: [{ monto: '' }] });
  });
});
