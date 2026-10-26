import { describe, expect, it } from 'vitest';
import type { Prestamo, Uuid } from '../hechos';
import { op48 } from '../operaciones/op-48';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { bancoAgricola, condicionesAgricola } from './agricola';
import type { CondicionesModelo, PagoPrestamo } from './contrato';

const m = (t: string) => Centavos.desdeTexto(t);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/** Ejemplo numérico de 01 A.2: M = 10,000; i = 12 %; S₁ = 5.00; Q = 350; F₀ = 15 ene 2027. */
const ejemplo: CondicionesModelo = {
  montoOriginal: m('10000.00'),
  fechaApertura: f('2027-01-15'),
  tasaNominalAnualMillonesimas: 120_000,
  seguroPrimerMes: m('5.00'),
  cuotaPactada: m('350.00'),
  plazoCuotas: 36,
};

const pago = (
  pid: string,
  fecha: string,
  total: string,
  numeroCuota: number | null = null,
): PagoPrestamo => ({
  id: id(pid),
  tipo: 'cuota',
  fecha: f(fecha),
  capital: m(total),
  interes: Centavos.cero,
  seguro: Centavos.cero,
  numeroCuota,
});

const abono: PagoPrestamo = {
  id: id('abono'),
  tipo: 'abono',
  fecha: f('2027-03-20'),
  capital: m('500.00'),
  interes: Centavos.cero,
  seguro: Centavos.cero,
  numeroCuota: null,
};

const prestamo: Prestamo = {
  cuentaId: id('pr'),
  tipo: 'prestamo',
  contraparte: 'Banco',
  montoOriginal: m('10000.00'),
  tasaNominalAnualMillonesimas: 120_000,
  tipoTasa: 'fija',
  seguroPrimerMes: m('5.00'),
  comision: null,
  frecuencia: 'mensual',
  frecuenciaDias: null,
  cuotaPactada: m('350.00'),
  plazoCuotas: 36,
  modeloCalculo: 'banco_agricola',
  cuotasPagadasAlCrear: 0,
  revision: null,
};

describe('PRU-DOM-CTA', () => {
  it('PRU-DOM-CTA-101 [CA-55.1, CA-55.2] MOT-AnexoA OP-48@dom: ejemplo de 01 A.2 al centavo (cuotas 1 a 3 con el abono del 20 de marzo), redondeo mitad hacia arriba de la proporción (CH-17), emparejamiento por número y por fecha (±10 días), umbral 0.99 × Q y OP-48 sin efecto presupuestario', () => {
    // Borde del redondeo (01 §0.4, 02 ADR-15 [CH-17]): ⌊(2·B·num + den) / (2·den)⌋, exacto en bigint.
    const p = Centavos.proporcionMitadArriba;
    expect(p(m('0.05'), 1, 2)).toBe(3); // 2.5 → 3
    expect(p(m('1.49'), 1, 100)).toBe(1); // 1.49 → 1
    expect(p(m('1.50'), 1, 100)).toBe(2); // 1.5 → 2
    expect(p(m('10.00'), 500, 1_000_000)).toBe(1); // seguro de $10.00 de saldo: 0.5 → 1
    expect(p(m('9.99'), 500, 1_000_000)).toBe(0); // 0.4995 → 0
    expect(p(Centavos.cero, 7, 3)).toBe(0);
    // 10,000 × 0.12 / 365 × 31 = 101.9178 → 101.92 (A.2), y un saldo cuyo producto pasa 2^53.
    expect(p(m('10000.00'), 120_000 * 31, 365_000_000)).toBe(10_192);
    expect(p(Centavos.desdeEntero(9_999_999_999), 120_000 * 31, 365_000_000)).toBe(101_917_808);
    expect(() => p(m('-1.00'), 1, 2)).toThrow(RangeError);
    expect(() => p(m('1.00'), -1, 2)).toThrow(RangeError);
    expect(() => p(m('1.00'), 1, 0)).toThrow(RangeError);
    expect(() => p(m('1.00'), 0.5, 2)).toThrow(RangeError);

    // Tabla de A.2 con el abono a capital del 20 de marzo (reglas 1 a 5).
    const tabla = bancoAgricola.proyectar(ejemplo, [abono]);
    expect(tabla.slice(0, 4)).toEqual([
      {
        tipo: 'cuota',
        numero: 1,
        fecha: f('2027-02-15'),
        dias: 31,
        saldoInicial: m('10000.00'),
        interes: m('101.92'),
        seguro: m('5.00'),
        capital: m('243.08'),
        saldoFinal: m('9756.92'),
      },
      {
        tipo: 'cuota',
        numero: 2,
        fecha: f('2027-03-15'),
        dias: 28,
        saldoInicial: m('9756.92'),
        interes: m('89.82'),
        seguro: m('4.88'),
        capital: m('255.30'),
        saldoFinal: m('9501.62'),
      },
      {
        tipo: 'abono',
        pagoId: id('abono'),
        fecha: f('2027-03-20'),
        saldoInicial: m('9501.62'),
        capital: m('500.00'),
        saldoFinal: m('9001.62'),
      },
      {
        tipo: 'cuota',
        numero: 3,
        fecha: f('2027-04-15'),
        dias: 31,
        saldoInicial: m('9001.62'),
        interes: m('91.74'),
        seguro: m('4.50'),
        capital: m('253.76'),
        saldoFinal: m('8747.86'),
      },
    ]);

    // Q se mantiene y el plazo se acorta (regla 5); la última cuota puede ser menor que Q (regla 4).
    const cuotasSinAbono = bancoAgricola.proyectar(ejemplo, []);
    const cuotasConAbono = tabla.filter((x) => x.tipo === 'cuota');
    expect(cuotasConAbono.length).toBeLessThan(cuotasSinAbono.length);
    const ultima = cuotasConAbono.at(-1);
    expect(ultima?.saldoFinal).toBe(0);
    expect(ultima !== undefined && ultima.interes + ultima.seguro + ultima.capital).toBeLessThan(
      m('350.00'),
    );
    // Recorte al último día del mes (regla 1) y un abono que salda todo antes de la cuota.
    const fin = { ...ejemplo, fechaApertura: f('2027-01-31') };
    expect(
      bancoAgricola
        .proyectar(fin, [])
        .slice(0, 2)
        .map((x) => x.fecha),
    ).toEqual([f('2027-02-28'), f('2027-03-31')]);
    const total = { ...abono, fecha: f('2027-01-20'), capital: m('20000.00') };
    expect(bancoAgricola.proyectar(ejemplo, [total])).toEqual([
      {
        tipo: 'abono',
        pagoId: id('abono'),
        fecha: f('2027-01-20'),
        saldoInicial: m('10000.00'),
        capital: m('10000.00'),
        saldoFinal: Centavos.cero,
      },
    ]);

    // Desglose propuesto con el capital pendiente registrado y las fechas programadas (regla 8).
    expect(bancoAgricola.desglosePropuesto(ejemplo, 3, m('9001.62'))).toEqual({
      interes: m('91.74'),
      seguro: m('4.50'),
      capital: m('253.76'),
    });
    expect(bancoAgricola.desglosePropuesto(ejemplo, 1, m('100.00'))).toEqual({
      interes: m('1.02'),
      seguro: m('0.05'),
      capital: m('100.00'),
    });

    // Emparejamiento (regla 7) y umbral 0.99 × Q (regla 6, CA-55.4): $346.50 en dos pagos.
    const pagos = [
      pago('b', '2027-02-20', '146.50'), // a 5 días de la cuota 1
      pago('a', '2027-02-14', '200.00'), // a 1 día de la cuota 1
      pago('c', '2027-02-23', '10.00'), // cuota 1 ya pagada; la 2 está a 20 días: sin cuota
      pago('d', '2027-03-25', '100.00'), // a 10 días de la cuota 2: borde incluido
      pago('e', '2027-05-26', '50.00'), // a 11 días de la cuota 4: fuera
      pago('g', '2027-01-01', '346.49', 3), // por número, aunque la fecha esté lejos
      pago('h', '2027-02-14', '5.00', 99), // número de cuota que no existe
    ];
    // Los abonos no se emparejan con cuotas; los pagos se procesan por (fecha, id).
    expect(bancoAgricola.emparejar(ejemplo, [...pagos, abono])).toEqual([
      { pagoId: id('g'), numero: 3 },
      { pagoId: id('a'), numero: 1 },
      { pagoId: id('h'), numero: null },
      { pagoId: id('b'), numero: 1 },
      { pagoId: id('c'), numero: null },
      { pagoId: id('d'), numero: 2 },
      { pagoId: id('e'), numero: null },
    ]);
    // El orden de llegada no cambia el resultado; con la cuota 1 sin completar, el 18 feb va a ella.
    const dos = [pago('a', '2027-02-14', '200.00'), pago('c', '2027-02-18', '10.00')];
    expect(bancoAgricola.emparejar(ejemplo, [...dos].reverse())).toEqual([
      { pagoId: id('a'), numero: 1 },
      { pagoId: id('c'), numero: 1 },
    ]);

    // Estados y comparación (salidas 4 y 5): pagada (≥ 346.50), parcial, atrasada y pendiente.
    const comparacion = bancoAgricola.comparar(ejemplo, [...pagos, abono], f('2027-04-01'));
    expect(comparacion.slice(0, 4).map((x) => [x.numero, x.estado, x.pagado.total])).toEqual([
      [1, 'pagada', m('346.50')],
      [2, 'atrasada', m('100.00')],
      [3, 'parcial', m('346.49')],
      [4, 'pendiente', Centavos.cero],
    ]);
    expect(comparacion[0]?.pagos).toEqual([id('a'), id('b')]);
    expect(comparacion[0]?.proyectado).toEqual({
      interes: m('101.92'),
      seguro: m('5.00'),
      capital: m('243.08'),
      total: m('350.00'),
    });
    expect(comparacion[0]?.pagado).toEqual({
      interes: Centavos.cero,
      seguro: Centavos.cero,
      capital: m('346.50'),
      total: m('346.50'),
    });
    // La última cuota, menor que Q, se paga con el 99 % de su propio monto.
    const n = cuotasConAbono.length;
    const ultimaFecha = cuotasConAbono.at(-1)?.fecha ?? f('2000-01-01');
    const pagoUltima: PagoPrestamo = {
      ...pago('u', ultimaFecha, '0.00', n),
      capital: ultima?.capital ?? Centavos.cero,
      interes: ultima?.interes ?? Centavos.cero,
      seguro: ultima?.seguro ?? Centavos.cero,
    };
    const conUltima = bancoAgricola.comparar(ejemplo, [abono, pagoUltima], ultimaFecha);
    expect(conUltima.at(-1)).toMatchObject({ numero: n, estado: 'pagada', pagos: [id('u')] });

    // Condiciones de un préstamo (2.2.5): solo Banco Agrícola, mensual y con tasa.
    expect(condicionesAgricola(prestamo, f('2027-01-15'))).toEqual(ejemplo);
    expect(condicionesAgricola({ ...prestamo, seguroPrimerMes: null }, f('2027-01-15'))).toEqual({
      ...ejemplo,
      seguroPrimerMes: Centavos.cero,
    });
    expect(condicionesAgricola({ ...prestamo, modeloCalculo: null }, f('2027-01-15'))).toBeNull();
    expect(condicionesAgricola({ ...prestamo, frecuencia: 'semanal' }, f('2027-01-15'))).toBeNull();
    expect(
      condicionesAgricola({ ...prestamo, tasaNominalAnualMillonesimas: null }, f('2027-01-15')),
    ).toBeNull();

    // OP-48: solo actualiza la fila de `prestamos` con los campos que cambian; sin efecto presupuestario.
    const comando = {
      operacion: 'OP-48',
      prestamoId: id('pr'),
      campos: { cuotaPactada: m('360.00'), plazoCuotas: 36, modeloCalculo: null },
      esperado: { cuotaPactada: m('350.00'), plazoCuotas: 36, modeloCalculo: 'banco_agricola' },
    } as const;
    expect(op48([prestamo], comando)).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'prestamos',
        id: id('pr'),
        campos: { cuotaPactada: m('360.00'), modeloCalculo: null },
      },
    ]);
    expect(op48([prestamo], { ...comando, campos: { plazoCuotas: 36 } })).toEqual([]);
    expect(op48([], comando)).toEqual({
      codigo: 'cuenta_tipo_no_valido',
      campo: 'prestamoId',
      datos: { prestamoId: id('pr') },
    });
  });
});
