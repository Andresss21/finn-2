import { describe, expect, it } from 'vitest';
import type {
  Cuenta,
  Efecto,
  Linea,
  OcurrenciaResuelta,
  Programada,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { clasificacion } from './clasificacion';
import { ocurrencias, pendientes } from './ocurrencias';
import {
  aplicarPago,
  cicloDeFacturacion,
  desgloseAlPagar,
  fechaDeCorte,
  patrimonioNeto,
  ultimoCorteAntesDe,
} from './patrimonio';
import { ciclo } from './periodos';
import { porCobrar } from './por-cobrar';

const m = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const mensual = ciclo([{ diaInicio: 1, rigeDesde: null }]);

type LineaNueva = { cat?: string; deudor?: string; de?: string; monto: number };

/** Hechos mínimos con efectos explícitos por cuenta, como en lpa.test.ts. */
class Libro {
  readonly cuentas: Cuenta[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly condonaciones = [];

  constructor(cuentas: [string, TipoCuenta][]) {
    for (const [nombre, tipo] of cuentas)
      this.cuentas.push({ id: id(nombre), tipo, nombre } as Cuenta);
  }

  mov(
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    efectos: [string, number, { interes: number; seguro: number }?][],
    lineas: LineaNueva[] = [],
    lineaCobrada: string | null = null,
  ) {
    const n = String(this.transacciones.length + 1);
    const total =
      lineas.length > 0 ? lineas.reduce((s, l) => s + l.monto, 0) : Math.abs(efectos[0]?.[1] ?? 0);
    this.transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: n,
      estadoBancario: 'confirmada',
      total: m(total),
      lineaCobradaId: lineaCobrada && id(lineaCobrada),
    } as Transaccion);
    efectos.forEach(([cuenta, monto, desglose], i) =>
      this.efectos.push({
        id: id(`ef-${tx}-${i}`),
        transaccionId: id(tx),
        cuentaId: id(cuenta),
        monto: m(monto),
        interes: desglose ? m(desglose.interes) : null,
        seguro: desglose ? m(desglose.seguro) : null,
      } as Efecto),
    );
    lineas.forEach((l, i) =>
      this.lineas.push({
        id: id(`${tx}-${i}`),
        transaccionId: id(tx),
        orden: i + 1,
        monto: m(l.monto),
        categoriaId: l.cat === undefined ? null : id(l.cat),
        deudorId: l.deudor === undefined ? null : id(l.deudor),
        lineaOriginalId: l.de === undefined ? null : id(l.de),
      } as Linea),
    );
    return this;
  }
}

const programada = (x: Partial<Programada>): Programada =>
  ({
    id: id('p'),
    frecuencia: 'mensual',
    frecuenciaDias: null,
    primeraFecha: f('2027-01-01'),
    fechaFin: null,
    activa: true,
    ...x,
  }) as Programada;

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-107 MOT-4.13, MOT-4.14 y MOT-4.16: clasificación para reportes (01 §4.13), patrimonio neto, fechas de corte con fin de mes, desglose al pagar y monto para no generar intereses (01 §4.14) con los números de ESC-08; ocurrencias de programadas por frecuencia con recorte, fecha de fin, inactivas y pendientes con atrasadas (01 §4.16)', () => {
    const l = new Libro([
      ['ef', 'efectivo'],
      ['ef2', 'efectivo'],
      ['t', 'tarjeta'],
      ['t2', 'tarjeta'],
      ['pr', 'prestamo'],
      ['inv', 'inversion'],
    ]);
    l.mov('si-ef', 'saldo_inicial', '2027-01-01', [['ef', 1000]])
      .mov('si-pr', 'saldo_inicial', '2027-01-01', [['pr', 5000]])
      .mov('si-inv', 'saldo_inicial', '2027-01-01', [['inv', 400]])
      .mov('si-t2', 'saldo_inicial', '2027-01-01', [['t2', 25]])
      .mov('ing', 'ingreso', '2027-01-05', [['ef', 500]])
      .mov('des', 'desembolso_prestamo', '2027-01-06', [
        ['ef', 2000],
        ['pr', 2000],
      ])
      .mov('compra', 'gasto', '2027-01-10', [['t', -200]], [{ cat: 'super', monto: 200 }])
      .mov(
        'comp',
        'gasto',
        '2027-01-11',
        [['ef', -190]],
        [
          { cat: 'super', monto: 50 },
          { deudor: 'ana', monto: 100 },
          { deudor: 'beto', monto: 40 },
        ],
      )
      .mov(
        'dev1',
        'devolucion',
        '2027-01-12',
        [['t', 20]],
        [{ cat: 'super', de: 'compra-0', monto: 20 }],
      )
      .mov('cobro', 'cobro', '2027-01-20', [['ef', 130]], [], 'comp-1')
      .mov('dev2', 'devolucion', '2027-01-21', [['ef', 10]], [{ cat: 'casa', monto: 10 }])
      .mov(
        'pago',
        'pago_tarjeta',
        '2027-02-05',
        [
          ['ef', -100],
          ['t', 100],
        ],
        [{ cat: 'pagoT', monto: 100 }],
      )
      .mov(
        'cuota',
        'cuota_prestamo',
        '2027-02-10',
        [
          ['ef', -300],
          ['pr', -250, { interes: 40, seguro: 10 }],
        ],
        [{ cat: 'casa', monto: 300 }],
      )
      .mov('cash', 'entrada_tarjeta', '2027-02-11', [['t', 15]])
      .mov('avance', 'avance_efectivo', '2027-02-12', [
        ['t', -50],
        ['ef', 50],
      ])
      .mov('retiro', 'retiro_inversion', '2027-02-13', [
        ['inv', -100],
        ['ef', 100],
      ])
      .mov(
        'aporte',
        'aporte_inversion',
        '2027-02-14',
        [
          ['ef', -60],
          ['inv', 60],
        ],
        [{ cat: 'casa', monto: 60 }],
      )
      .mov('transf', 'transferencia', '2027-02-15', [
        ['ef', -80],
        ['ef2', 80],
      ])
      .mov('ajuste', 'ajuste_inversion', '2027-02-16', [['inv', 5]]);
    const cobros = porCobrar(l);

    // §4.13: cada movimiento en su clase; el gasto, neto de devoluciones y por categoría.
    const x = clasificacion(l, mensual, cobros);
    const totales: Record<string, number> = {};
    for (const p of x.partidas) {
      const k = p.clase === 'gasto' ? `gasto:${p.categoriaId}` : p.clase;
      totales[k] = (totales[k] ?? 0) + p.monto;
    }
    expect(totales).toEqual({
      ingreso: m(500 + 30 + 15), // ingreso, excedente del cobro y cashback
      otras_entradas: m(2000 + 50 + 100), // desembolso, avance y retiro
      restitucion: m(100),
      saldo_inicial: m(1000 + 5000 + 400 + 25),
      'gasto:super': m(200 - 20 + 50), // la devolución D-1 netea la compra
      'gasto:casa': m(-10 + 300 + 60), // devolución D-2, cuota y aporte
      neutral: m(100 + 80), // pago de tarjeta y transferencia
    });
    expect(x.partidas.find((p) => p.transaccionId === id('ajuste'))).toBeUndefined();
    expect(x.costosFinancieros).toEqual([
      {
        transaccionId: id('cuota'),
        fecha: f('2027-02-10'),
        prestamoId: id('pr'),
        categoriaId: id('casa'),
        interes: m(40),
        seguro: m(10),
      },
    ]);

    // §4.14: efectivo + a favor + inversiones + por cobrar abiertos − deudas − capital pendiente.
    expect(patrimonioNeto(l, cobros)).toEqual({
      efectivo: m(3140),
      saldosAFavor: m(25),
      inversiones: m(365),
      porCobrar: m(40),
      deudasDeTarjeta: m(115),
      prestamos: m(6750),
      total: m(3140 + 25 + 365 + 40 - 115 - 6750),
    });

    // Fecha de corte con fin de mes: el día de corte se recorta a los días del mes.
    expect([
      fechaDeCorte(31, f('2027-02-10')),
      fechaDeCorte(31, f('2028-02-10')),
      fechaDeCorte(30, f('2027-02-01')),
      fechaDeCorte(31, f('2027-04-30')),
      fechaDeCorte(15, f('2027-04-30')),
    ]).toEqual([
      f('2027-02-28'),
      f('2028-02-29'),
      f('2027-02-28'),
      f('2027-04-30'),
      f('2027-04-15'),
    ]);
    expect(ultimoCorteAntesDe(31, f('2027-03-01'))).toBe(f('2027-02-28'));
    expect(ultimoCorteAntesDe(31, f('2027-03-31'))).toBe(f('2027-02-28'));
    expect(ultimoCorteAntesDe(15, f('2027-02-15'))).toBe(f('2027-01-15'));
    expect(ultimoCorteAntesDe(15, f('2027-02-16'))).toBe(f('2027-02-15'));
    expect(cicloDeFacturacion(31, f('2027-03-10'))).toEqual({
      desde: f('2027-03-01'),
      hasta: f('2027-03-31'),
    });
    expect(cicloDeFacturacion(15, f('2027-02-15'))).toEqual({
      desde: f('2027-01-16'),
      hasta: f('2027-02-15'),
    });
    expect(cicloDeFacturacion(15, f('2027-02-16'))).toEqual({
      desde: f('2027-02-16'),
      hasta: f('2027-03-15'),
    });

    // ESC-08: corte el 15; compras de 200 (3 feb) y 100 (18 feb); pago de 150 el 19 feb.
    const t = { cuentaId: id('t'), diaCorte: 15 };
    const e8 = new Libro([
      ['ef', 'efectivo'],
      ['t', 'tarjeta'],
    ])
      .mov('c1', 'gasto', '2027-02-03', [['t', -200]], [{ cat: 'super', monto: 200 }])
      .mov('c2', 'gasto', '2027-02-18', [['t', -100]], [{ cat: 'super', monto: 100 }]);
    const antes = desgloseAlPagar(e8, t, f('2027-02-19'));
    expect(antes).toEqual({
      corte: f('2027-02-15'),
      deudaAnterior: m(200),
      cargosDelCiclo: m(100),
      yaPagado: m(0),
      paraNoGenerarIntereses: m(200),
    });
    // El pago se presenta aplicado primero a la deuda anterior.
    expect(aplicarPago(antes, m(150))).toEqual({ aDeudaAnterior: m(150), resto: m(0) });
    expect(aplicarPago(antes, m(260))).toEqual({ aDeudaAnterior: m(200), resto: m(60) });
    e8.mov(
      'p1',
      'pago_tarjeta',
      '2027-02-19',
      [
        ['ef', -150],
        ['t', 150],
      ],
      [{ cat: 'pagoT', monto: 150 }],
    );
    const despues = desgloseAlPagar(e8, t, f('2027-02-19'));
    expect(despues).toMatchObject({
      yaPagado: m(150),
      cargosDelCiclo: m(100),
      paraNoGenerarIntereses: m(50),
    });
    expect(aplicarPago(despues, m(150))).toEqual({ aDeudaAnterior: m(50), resto: m(100) });
    // Un saldo a favor al corte no es deuda anterior.
    expect(
      desgloseAlPagar(l, { cuentaId: id('t2'), diaCorte: 15 }, f('2027-02-20')).deudaAnterior,
    ).toBe(m(0));

    // §4.16: ocurrencia k por frecuencia, con recorte al último día del mes en mensual y anual.
    const hasta = (p: Programada, h: string) => ocurrencias(p, f(h));
    expect(hasta(programada({ primeraFecha: f('2027-01-31') }), '2027-05-31')).toEqual(
      ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'].map(f),
    );
    expect(
      hasta(programada({ frecuencia: 'anual', primeraFecha: f('2028-02-29') }), '2032-03-01'),
    ).toEqual(['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29'].map(f));
    expect(hasta(programada({ frecuencia: 'semanal' }), '2027-01-29')).toEqual(
      ['2027-01-01', '2027-01-08', '2027-01-15', '2027-01-22', '2027-01-29'].map(f),
    );
    expect(hasta(programada({ frecuencia: 'quincenal' }), '2027-02-15')).toEqual(
      ['2027-01-01', '2027-01-15', '2027-01-29', '2027-02-12'].map(f),
    );
    // Generación solo hasta la fecha de fin y mientras está activa.
    const cadaDiez = programada({
      frecuencia: 'cada_n_dias',
      frecuenciaDias: 10,
      fechaFin: f('2027-01-25'),
    });
    expect(hasta(cadaDiez, '2027-03-01')).toEqual(
      ['2027-01-01', '2027-01-11', '2027-01-21'].map(f),
    );
    expect(hasta({ ...cadaDiez, activa: false }, '2027-03-01')).toEqual([]);
    expect(() => hasta(programada({ frecuencia: 'cada_n_dias' }), '2027-03-01')).toThrow(
      RangeError,
    );

    // Pendientes: sin resolución y con fecha ≤ hoy + horizonte; atrasadas si fecha < hoy.
    const programadas = [
      programada({ id: id('A'), primeraFecha: f('2027-01-31') }),
      programada({ id: id('B'), frecuencia: 'semanal', primeraFecha: f('2027-02-20') }),
      programada({
        id: id('C'),
        frecuencia: 'cada_n_dias',
        frecuenciaDias: 30,
        primeraFecha: f('2027-03-05'),
      }),
      programada({ id: id('D'), frecuencia: 'semanal', activa: false }),
    ];
    const resuelta = (programadaId: string, fecha: string, estado: OcurrenciaResuelta['estado']) =>
      ({ programadaId: id(programadaId), fechaEsperada: f(fecha), estado }) as OcurrenciaResuelta;
    const ocurrencias_resueltas = [
      resuelta('A', '2027-01-31', 'registrada'),
      resuelta('B', '2027-02-27', 'omitida'),
    ];
    expect(pendientes({ programadas, ocurrencias_resueltas }, f('2027-03-05'), 7)).toEqual([
      { programadaId: id('B'), fecha: f('2027-02-20'), atrasada: true },
      { programadaId: id('A'), fecha: f('2027-02-28'), atrasada: true },
      { programadaId: id('C'), fecha: f('2027-03-05'), atrasada: false },
      { programadaId: id('B'), fecha: f('2027-03-06'), atrasada: false },
    ]);
  });
});
