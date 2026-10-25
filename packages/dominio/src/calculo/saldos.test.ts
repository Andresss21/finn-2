import { describe, expect, it } from 'vitest';
import type { EstadoBancario, Hechos, TipoTransaccion, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import {
  capitalPendiente,
  deuda,
  saldo,
  saldoAFavor,
  saldoAl,
  saldoConfirmado,
  valorDeInversion,
} from './saldos';

const c = (n: number) => Centavos.desdeEntero(n);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

type Mov = {
  tipo: TipoTransaccion;
  fecha: string;
  estado: EstadoBancario;
  efectos: [cuenta: string, monto: number, interes?: number, seguro?: number][];
};

/** Hechos mínimos para saldos: solo transacciones y efectos (lo único que lee §4.3). */
function hechos(movs: Mov[]): Pick<Hechos, 'transacciones' | 'efectos'> {
  const transacciones = movs.map((m, i) => ({
    id: id(`tx${i}`),
    tipo: m.tipo,
    fecha: f(m.fecha),
    estadoBancario: m.estado,
  }));
  const efectos = movs.flatMap((m, i) =>
    m.efectos.map(([cuenta, monto, interes, seguro], j) => ({
      id: id(`ef${i}-${j}`),
      transaccionId: id(`tx${i}`),
      cuentaId: id(cuenta),
      monto: c(monto),
      interes: interes === undefined ? null : c(interes),
      seguro: seguro === undefined ? null : c(seguro),
    })),
  );
  return { transacciones, efectos } as unknown as Pick<Hechos, 'transacciones' | 'efectos'>;
}

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-103 [INV-04] saldos (01 §4.3): saldo, saldo a una fecha, saldo confirmado, deuda y saldo a favor por tipo de cuenta; el préstamo cuenta solo el capital', () => {
    const h = hechos([
      // Efectivo E.
      {
        tipo: 'saldo_inicial',
        fecha: '2026-01-01',
        estado: 'confirmada',
        efectos: [['E', 100000]],
      },
      { tipo: 'gasto', fecha: '2026-02-05', estado: 'conciliada', efectos: [['E', -20000]] },
      { tipo: 'ingreso', fecha: '2026-02-10', estado: 'pendiente', efectos: [['E', 50000]] },
      // Tarjeta T (límite 1.000): compra y pago parcial pendiente.
      { tipo: 'gasto', fecha: '2026-02-03', estado: 'confirmada', efectos: [['T', -30000]] },
      {
        tipo: 'pago_tarjeta',
        fecha: '2026-02-09',
        estado: 'pendiente',
        efectos: [
          ['E', -10000],
          ['T', 10000],
        ],
      },
      // Tarjeta T2: una devolución mayor que la compra la deja con saldo a favor.
      { tipo: 'gasto', fecha: '2026-02-03', estado: 'confirmada', efectos: [['T2', -5000]] },
      { tipo: 'devolucion', fecha: '2026-02-04', estado: 'confirmada', efectos: [['T2', 7500]] },
      // Préstamo P: capital inicial, una cuota con desglose y una cuota solo de interés.
      {
        tipo: 'saldo_inicial',
        fecha: '2026-01-01',
        estado: 'confirmada',
        efectos: [['P', 500000]],
      },
      {
        tipo: 'cuota_prestamo',
        fecha: '2026-02-15',
        estado: 'confirmada',
        efectos: [
          ['E', -10000],
          ['P', -8000, 1500, 500],
        ],
      },
      {
        tipo: 'cuota_prestamo',
        fecha: '2026-02-16',
        estado: 'pendiente',
        efectos: [
          ['E', -2000],
          ['P', 0, 1800, 200],
        ],
      },
      // Inversión I: aporte y ajuste de valor.
      {
        tipo: 'aporte_inversion',
        fecha: '2026-02-01',
        estado: 'confirmada',
        efectos: [
          ['E', -30000],
          ['I', 30000],
        ],
      },
      {
        tipo: 'ajuste_inversion',
        fecha: '2026-02-20',
        estado: 'pendiente',
        efectos: [['I', -2000]],
      },
    ]);

    // inv. 4: el saldo es exactamente la suma de los efectos de la cuenta.
    // E: 1.000 − 200 + 500 − 100 − 100 − 20 − 300 = 780.
    expect(saldo(h, id('E'))).toBe(78000);
    expect(saldoAl(h, id('E'), f('2026-02-05'))).toBe(50000); // 1.000 − 200 − 300
    expect(saldoAl(h, id('E'), f('2025-12-31'))).toBe(0);
    // Confirmado: sin el ingreso, el pago ni la segunda cuota (pendientes).
    expect(saldoConfirmado(h, id('E'))).toBe(40000); // 1.000 − 200 − 100 − 300

    expect(saldo(h, id('T'))).toBe(-20000);
    expect(saldoConfirmado(h, id('T'))).toBe(-30000);
    expect(deuda(h, id('T'))).toBe(20000);
    expect(saldoAFavor(h, id('T'))).toBe(0);

    expect(saldo(h, id('T2'))).toBe(2500);
    expect(deuda(h, id('T2'))).toBe(0);
    expect(saldoAFavor(h, id('T2'))).toBe(2500);

    // Préstamo: solo el capital (−80); interés y seguro son costo (H6, 2.2.10).
    expect(capitalPendiente(h, id('P'))).toBe(492000);
    expect(saldoAl(h, id('P'), f('2026-02-14'))).toBe(500000);

    expect(valorDeInversion(h, id('I'))).toBe(28000);
    expect(saldoConfirmado(h, id('I'))).toBe(30000);

    // Una cuenta sin efectos tiene saldo 0; un efecto sin su transacción es un error de los hechos.
    expect(saldo(h, id('X'))).toBe(0);
    const rotos = { ...h, transacciones: [] };
    expect(() => saldo(rotos, id('E'))).toThrow(RangeError);
  });
});
