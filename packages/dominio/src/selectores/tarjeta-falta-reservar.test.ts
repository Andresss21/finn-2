// FT-29 «Te falta reservar»: un solo número por tarjeta en todas las consultas (CA-29.6) y el próximo pago del detalle de la
// categoría de pago igual al de Cuentas (CA-29.8, [R5]). El estado sale de las operaciones del motor (DP-27); hoy fijo (07 §7.1).
import { describe, expect, it } from 'vitest';
import { ejecutorMotor } from '../../escenarios/motor';
import type { Escenario, Op } from '../../escenarios/tipos';
import { calcular } from '../calculo/calcular';
import type { Uuid } from '../hechos';
import { cuentas } from './cuentas';
import { detallePagoTarjeta } from './detalle-pago-tarjeta';
import { inicio } from './inicio';
import { presupuesto } from './presupuesto';

async function estado(ops: Op[], hoy: string) {
  const e: Escenario = {
    id: 'ESC-FALTA-RESERVAR',
    titulo: 'te falta reservar',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  const s = await ejecutorMotor.iniciar(e, hoy);
  return calcular(s.hechos, s.hoy);
}

describe('te falta reservar por tarjeta', () => {
  it('PRU-DOM-TARJ-101 [CA-29.6, AV-07] con deudas en dos tarjetas Presupuesto, Inicio, Cuentas y el detalle de cada categoría de pago dan el mismo «Te falta reservar»', async () => {
    const i = await estado(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
        { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 300 },
        { op: 'OP-01', cuenta: 'Master', tipo: 'tarjeta', saldo: 150 },
      ],
      '2027-02-05',
    );
    const enPresupuesto = Object.fromEntries(
      presupuesto(i).pagosTarjeta.map((x) => [x.tarjeta.nombre, x.faltaReservar]),
    );
    const enInicio = Object.fromEntries(
      inicio(i, false).atencion.faltaReservar.map((x) => [x.tarjeta.nombre, x.monto]),
    );
    const enCuentas = Object.fromEntries(
      cuentas(i).tarjetas.map((x) => [x.cuenta.nombre, x.faltaReservar]),
    );
    const enDetalle = Object.fromEntries(
      i.hechos.categorias
        .filter((c) => c.clase === 'pago')
        .map((c) => {
          const d = detallePagoTarjeta(i, c.id);
          return [d.tarjeta.nombre, d.tarjetaHoy.faltaReservar];
        }),
    );
    expect(enPresupuesto).toEqual({ Visa: 30000, Master: 15000 });
    expect(enInicio).toEqual(enPresupuesto);
    expect(enCuentas).toEqual(enPresupuesto);
    expect(enDetalle).toEqual(enPresupuesto);
  });

  it('PRU-DOM-TARJ-101 [CA-29.8] el próximo pago de Visa Oro (día 15) es el 15/11 en el detalle de su categoría de pago y en Cuentas', async () => {
    const apertura = { apertura: '2026-03-21', hoy: '2026-03-21' };
    const i = await estado(
      [
        { op: 'OP-01', cuenta: 'Cuenta corriente', saldo: 3000, ...apertura },
        {
          op: 'OP-01',
          cuenta: 'Visa Oro',
          tipo: 'tarjeta',
          diaCorte: 25,
          diaPago: 15,
          ...apertura,
        },
      ],
      '2026-10-18',
    );
    const categoria = i.hechos.categorias.find((c) => c.clase === 'pago');
    const detalle = detallePagoTarjeta(i, categoria?.id as Uuid);
    const tarjeta = cuentas(i).tarjetas.find((x) => x.cuenta.nombre === 'Visa Oro');
    expect(detalle.desgloseAlPagar.proximoPago).toBe('2026-11-15');
    expect(tarjeta?.proximoPago).toBe(detalle.desgloseAlPagar.proximoPago);
  });
});
