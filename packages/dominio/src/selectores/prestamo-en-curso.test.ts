// [CH-261] Préstamo en curso (P13): las cuotas ya pagadas al crearlo en Finn y el capital pendiente registrado hacen que la tabla
// de amortización (Anexo A.2), la próxima cuota (CH-252) y el desglose propuesto (OP-24) arranquen en el punto correcto. [CH-264]
// La apertura es la fecha original del préstamo: la cuota n vence en apertura + n meses. Sin tasa, o con datos que no cierran,
// no hay tabla.
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type { BigintTexto, Cuenta, Efecto, Hechos, Instante, Transaccion, Uuid } from '../hechos';
import { desglosePropuesto } from '../operaciones/op-24';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { cuentas } from './cuentas';
import { detalleCuenta } from './detalle-cuenta';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * El préstamo del usuario: $6,295.00, mensual, cuota $377.98, 18 cuotas, 6 ya pagadas, capital pendiente $3,934.62, Banco
 * Agrícola, abierto el `apertura` (la fecha original del préstamo, CH-264); hoy = `hoy`. La tasa en millonésimas: 8.25 % o vacía.
 */
function estado(
  apertura: string,
  hoy: string,
  modelo: 'banco_agricola' | null = 'banco_agricola',
  tasa: number | null = 82_500,
) {
  const cuenta = {
    id: id('pr'),
    tipo: 'prestamo',
    nombre: 'Préstamo',
    fechaApertura: f(apertura),
    ultimos4: null,
    institucionId: null,
    orden: 1,
    archivada: false,
  } as Cuenta;
  const saldoInicial: Transaccion = {
    id: id('si-pr'),
    tipo: 'saldo_inicial',
    fecha: f(apertura),
    horaRegistro: `${apertura}T12:00:00.000Z` as Instante,
    claveOrden: `${apertura}T12:00:00.000Z` as Instante,
    secuencia: '1' as BigintTexto,
    origen: 'manual',
    estadoBancario: 'confirmada',
    conciliacionId: null,
    comercio: null,
    nota: null,
    total: c(3934.62),
    monedaOriginal: null,
    montoOriginal: null,
    lineaCobradaId: null,
    revision: null,
  };
  const efecto: Efecto = {
    id: id('e-si-pr'),
    transaccionId: id('si-pr'),
    cuentaId: id('pr'),
    monto: c(3934.62),
    interes: null,
    seguro: null,
    revision: null,
  };
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [cuenta],
    tarjetas: [],
    prestamos: [
      {
        cuentaId: id('pr'),
        tipo: 'prestamo',
        contraparte: 'Banco Agrícola',
        montoOriginal: c(6295),
        tasaNominalAnualMillonesimas: tasa,
        tipoTasa: 'variable',
        seguroPrimerMes: null,
        comision: null,
        frecuencia: 'mensual',
        frecuenciaDias: null,
        cuotaPactada: c(377.98),
        plazoCuotas: 18,
        modeloCalculo: modelo,
        cuotasPagadasAlCrear: 6,
        revision: null,
      },
    ],
    inversiones: [],
    grupos: [],
    categorias: [],
    asignaciones: [],
    deudores: [],
    transacciones: [saldoInicial],
    efectos: [efecto],
    lineas: [],
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return calcular(hechos, f(hoy));
}

/** La fecha original del préstamo del usuario y su `hoy` (CH-264). */
const APERTURA = '2026-05-08';
const HOY = '2026-11-13';
/** El talón de la cuota 7: vence el 08/12/2026, apertura + 7 meses, con la cuota pactada. */
const SEPTIMA = { fecha: f('2026-12-08'), monto: c(377.98), numero: 7 };

describe('préstamo en curso (P13, CH-261, CH-264)', () => {
  it('PRU-DOM-CTA-810 [Q-detalleCuenta, Q-cuentas] con 6 de 18 cuotas pagadas al crear y $3,934.62 pendientes, la tabla arranca en la cuota 7 desde el capital registrado, el 08/12/2026 (apertura + 7 meses), y la próxima cuota es la 7 (CH-264, P13)', () => {
    const i = estado(APERTURA, HOY);
    const pr = detalleCuenta(i, id('pr')).prestamo;
    const tabla = pr?.amortizacion ?? [];
    // Las cuotas 1 a 6 se pagaron antes de Finn: no son deuda ni se arrastran.
    expect(tabla.map((q) => q.numero)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(tabla.every((q) => q.estado === 'pendiente')).toBe(true);
    // B₆ = 3,934.62; cuota 7: del 08/11 al 08/12, 30 días, interés 3,934.62 × 8.25 % / 365 × 30 = 26.68, capital 351.30.
    expect(tabla[0]).toEqual({
      numero: 7,
      fecha: f('2026-12-08'),
      interes: c(26.68),
      seguro: c(0),
      capital: c(351.3),
      saldo: c(3583.32),
      estado: 'pendiente',
      pagado: c(0),
    });
    expect(tabla[1]).toMatchObject({
      numero: 8,
      fecha: f('2027-01-08'),
      interes: c(25.11),
      capital: c(352.87),
      saldo: c(3230.45),
    });
    // Q se mantiene: el capital se termina en la cuota 17, menor que Q (regla 4).
    expect(tabla.at(-1)).toMatchObject({
      numero: 17,
      fecha: f('2027-10-08'),
      interes: c(2.13),
      capital: c(314.13),
      saldo: c(0),
    });
    expect(pr?.capitalPendiente).toBe(c(3934.62));
    expect(pr?.proximaCuota).toEqual(SEPTIMA);
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual(SEPTIMA);
    // OP-24 propone la cuota 7 con el capital pendiente registrado (regla 8).
    expect(desglosePropuesto(i, id('pr'), f('2026-12-08'))).toEqual({
      desglosePropuesto: {
        interes: c(26.68),
        seguro: c(0),
        capital: c(351.3),
        total: c(377.98),
        numeroCuota: 7,
      },
      cuotaEmparejada: { numero: 7, fecha: f('2026-12-08'), estado: 'pendiente' },
    });
  });

  it('PRU-DOM-CTA-811 [Q-detalleCuenta] las cuotas 1 a 6, pagadas antes de Finn, nunca aparecen ni salen atrasadas; con la 7 en el futuro, lo proyectado y lo pagado hasta hoy son 0; vencida la 7 sin registrarse, sale atrasada (CH-264)', () => {
    const pr = detalleCuenta(estado(APERTURA, HOY), id('pr')).prestamo;
    expect(pr?.amortizacion?.some((q) => q.numero <= 6)).toBe(false);
    expect(pr?.amortizacion?.some((q) => q.estado === 'atrasada')).toBe(false);
    expect(pr?.comparacion).toEqual({ proyectadoHastaHoy: c(0), pagadoHastaHoy: c(0) });
    const despues = detalleCuenta(estado(APERTURA, '2026-12-20'), id('pr')).prestamo;
    const atrasadas = despues?.amortizacion?.filter((q) => q.estado === 'atrasada');
    expect(atrasadas?.map((q) => q.numero)).toEqual([7]);
    expect(despues?.comparacion).toEqual({ proyectadoHastaHoy: c(377.98), pagadoHastaHoy: c(0) });
  });

  it('PRU-DOM-CTA-812 [Q-cuentas] sin modelo, la próxima cuota es la 7, el 08/12/2026: apertura + 7 meses (CH-252, CH-264)', () => {
    const i = estado(APERTURA, HOY, null);
    expect(detalleCuenta(i, id('pr')).prestamo?.amortizacion).toBeNull();
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual(SEPTIMA);
  });

  it('PRU-DOM-CTA-830 [Q-detalleCuenta, Q-cuentas] el caso del usuario con la tasa vacía y Banco Agrícola: el modelo no puede calcular, no hay tabla ni comparación y el talón es el de la cuota pactada, la 7 el 08/12/2026 (CH-264)', () => {
    const i = estado(APERTURA, HOY, 'banco_agricola', null);
    const pr = detalleCuenta(i, id('pr')).prestamo;
    expect(pr?.amortizacion).toBeNull();
    expect(pr?.comparacion).toBeNull();
    expect(pr?.proximaCuota).toEqual(SEPTIMA);
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual(SEPTIMA);
  });

  it('PRU-DOM-CTA-831 [Q-detalleCuenta, Q-cuentas] con datos que no cierran (una tasa de 377.98 %, donde el interés pasa de la cuota), no hay tabla: nunca capital negativo ni saldo que crece, y el talón es el de la cuota pactada (CH-264)', () => {
    const i = estado(APERTURA, HOY, 'banco_agricola', 3_779_800);
    const pr = detalleCuenta(i, id('pr')).prestamo;
    expect(pr?.amortizacion).toBeNull();
    expect(pr?.comparacion).toBeNull();
    expect(pr?.proximaCuota).toEqual(SEPTIMA);
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual(SEPTIMA);
  });

  it('PRU-DOM-CTA-832 [Q-detalleCuenta] con 8.25 % la tabla es sensata: capital positivo, saldo que baja desde $3,934.62 hasta 0 antes de la cuota 18 e interés del orden de saldo × tasa / 12 (CH-264)', () => {
    const tabla = detalleCuenta(estado(APERTURA, HOY), id('pr')).prestamo?.amortizacion ?? [];
    let saldo = c(3934.62);
    for (const q of tabla) {
      expect(q.capital).toBeGreaterThan(0);
      expect(q.saldo).toBe(Centavos.restar(saldo, q.capital));
      // Entre 28 y 31 días: el interés está entre saldo × 8.25 % × 28 / 365 y saldo × 8.25 % × 31 / 365.
      expect(q.interes).toBeGreaterThanOrEqual(Math.floor((saldo * 0.0825 * 28) / 365));
      expect(q.interes).toBeLessThanOrEqual(Math.ceil((saldo * 0.0825 * 31) / 365));
      saldo = q.saldo;
    }
    expect(saldo).toBe(c(0));
    expect(tabla.at(-1)?.numero).toBeLessThanOrEqual(18);
  });
});
