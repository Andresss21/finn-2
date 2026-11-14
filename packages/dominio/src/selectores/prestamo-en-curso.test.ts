// [CH-261] Préstamo en curso (P13): las cuotas ya pagadas al crearlo en Finn y el capital pendiente registrado hacen que la tabla
// de amortización (Anexo A.2), la próxima cuota (CH-252) y el desglose propuesto (OP-24) arranquen en el punto correcto.
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
 * El préstamo del usuario: $6,295.00, mensual, cuota $377.98, 18 cuotas, 6 ya pagadas, capital pendiente $3,934.62 al 8.25 %
 * variable, Banco Agrícola, abierto en Finn el `apertura`; hoy = `hoy`.
 */
function estado(apertura: string, hoy: string, modelo: 'banco_agricola' | null = 'banco_agricola') {
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
        tasaNominalAnualMillonesimas: 82_500,
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

describe('préstamo en curso (P13, CH-261)', () => {
  it('PRU-DOM-CTA-810 [Q-detalleCuenta, Q-cuentas] con 6 de 18 cuotas pagadas al crear y $3,934.62 pendientes, la tabla arranca en la cuota 7 desde el capital registrado, un mes después de la apertura, y la próxima cuota es la 7 (CH-261, P13)', () => {
    const i = estado('2026-11-13', '2026-11-13');
    const pr = detalleCuenta(i, id('pr')).prestamo;
    const tabla = pr?.amortizacion ?? [];
    // Las cuotas 1 a 6 se pagaron antes de Finn: no son deuda ni se arrastran.
    expect(tabla.map((q) => q.numero)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(tabla.every((q) => q.estado === 'pendiente')).toBe(true);
    // B₆ = 3,934.62; cuota 7: 30 días, interés 3,934.62 × 8.25 % / 365 × 30 = 26.68, capital 377.98 − 26.68 = 351.30.
    expect(tabla[0]).toEqual({
      numero: 7,
      fecha: f('2026-12-13'),
      interes: c(26.68),
      seguro: c(0),
      capital: c(351.3),
      saldo: c(3583.32),
      estado: 'pendiente',
      pagado: c(0),
    });
    expect(tabla[1]).toMatchObject({
      numero: 8,
      fecha: f('2027-01-13'),
      interes: c(25.11),
      capital: c(352.87),
      saldo: c(3230.45),
    });
    // Q se mantiene: el capital se termina en la cuota 17, menor que Q (regla 4).
    expect(tabla.at(-1)).toMatchObject({
      numero: 17,
      fecha: f('2027-10-13'),
      interes: c(2.13),
      capital: c(314.13),
      saldo: c(0),
    });
    expect(pr?.capitalPendiente).toBe(c(3934.62));
    const proxima = { fecha: f('2026-12-13'), monto: c(377.98), numero: 7 };
    expect(pr?.proximaCuota).toEqual(proxima);
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual(proxima);
    // OP-24 propone la cuota 7 con el capital pendiente registrado (regla 8).
    expect(desglosePropuesto(i, id('pr'), f('2026-12-13'))).toEqual({
      desglosePropuesto: {
        interes: c(26.68),
        seguro: c(0),
        capital: c(351.3),
        total: c(377.98),
        numeroCuota: 7,
      },
      cuotaEmparejada: { numero: 7, fecha: f('2026-12-13'), estado: 'pendiente' },
    });
  });

  it('PRU-DOM-CTA-811 [Q-detalleCuenta] con la apertura seis meses antes, las cuotas 1 a 6 nunca aparecen atrasadas: solo las que vencieron después de la apertura sin registrarse (CH-261)', () => {
    const tabla = detalleCuenta(estado('2026-05-13', '2026-11-13'), id('pr')).prestamo
      ?.amortizacion;
    expect(tabla?.[0]).toMatchObject({ numero: 7, fecha: f('2026-06-13') });
    expect(tabla?.filter((q) => q.estado === 'atrasada').map((q) => q.numero)).toEqual([
      7, 8, 9, 10, 11,
    ]);
    expect(tabla?.some((q) => q.numero <= 6)).toBe(false);
  });

  it('PRU-DOM-CTA-812 [Q-cuentas] sin modelo, la próxima cuota es la 7, un mes después de la apertura (CH-252, CH-261)', () => {
    const i = estado('2026-11-13', '2026-11-13', null);
    expect(detalleCuenta(i, id('pr')).prestamo?.amortizacion).toBeNull();
    expect(cuentas(i).prestamos[0]?.proximaCuota).toEqual({
      fecha: f('2026-12-13'),
      monto: c(377.98),
      numero: 7,
    });
  });
});
