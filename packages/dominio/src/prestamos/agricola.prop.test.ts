// [CH-264] El modelo Banco Agrícola (01 Anexo A.2) nunca inventa una tabla absurda: con cualquier préstamo válido, o no hay
// tabla (sin tasa, o los datos no cierran) o cada cuota amortiza capital ≥ 0 y el saldo nunca crece.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Prestamo, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { bancoAgricola, condicionesAgricola } from './agricola';
import type { PagoPrestamo } from './contrato';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const prestamoArb = fc
  .record({
    monto: fc.integer({ min: 1, max: 20_000_000 }),
    proporcion: fc.integer({ min: 1, max: 100 }),
    tasa: fc.option(fc.integer({ min: 0, max: 1_000_000 }), { nil: null }),
    seguro: fc.option(fc.integer({ min: 0, max: 100_000 }), { nil: null }),
    cuota: fc.integer({ min: 1, max: 5_000_000 }),
    plazo: fc.integer({ min: 1, max: 360 }),
    pagadas: fc.integer({ min: 0, max: 360 }),
    dias: fc.integer({ min: 0, max: 3_650 }),
    abono: fc.integer({ min: 0, max: 1_000_000 }),
  })
  .map((x) => ({
    ...x,
    saldo: Math.max(1, Math.floor((x.monto * x.proporcion) / 100)),
    pagadas: Math.min(x.pagadas, x.plazo),
  }));

describe('PRU-PROP-CTA', () => {
  it('PRU-PROP-CTA-102 [Q-detalleCuenta] con cualquier préstamo válido del modelo Banco Agrícola, sin tasa no hay tabla y con tabla el capital de cada cuota es ≥ 0 y el saldo no crece, también con un abono (CH-264)', () => {
    fc.assert(
      fc.property(prestamoArb, (x) => {
        const apertura = FechaLocal.sumarDias(FechaLocal.desdeTexto('2020-01-01'), x.dias);
        const p: Prestamo = {
          cuentaId: 'pr' as Uuid,
          tipo: 'prestamo',
          contraparte: 'Banco',
          montoOriginal: Centavos.desdeEntero(x.monto),
          tasaNominalAnualMillonesimas: x.tasa,
          tipoTasa: 'fija',
          seguroPrimerMes: x.seguro === null ? null : Centavos.desdeEntero(x.seguro),
          comision: null,
          frecuencia: 'mensual',
          frecuenciaDias: null,
          cuotaPactada: Centavos.desdeEntero(x.cuota),
          plazoCuotas: x.plazo,
          modeloCalculo: 'banco_agricola',
          cuotasPagadasAlCrear: x.pagadas,
          revision: null,
        };
        const c = condicionesAgricola(p, apertura, Centavos.desdeEntero(x.saldo));
        if (x.tasa === null) expect(c).toBeNull();
        if (c === null) return;
        const abono: PagoPrestamo = {
          id: 'ab' as Uuid,
          tipo: 'abono',
          fecha: FechaLocal.sumarDias(apertura, 45 + x.pagadas * 30),
          capital: Centavos.desdeEntero(x.abono),
          interes: Centavos.cero,
          seguro: Centavos.cero,
          numeroCuota: null,
        };
        for (const pagos of [[], [abono]]) {
          let anterior = c.saldoInicial ?? c.montoOriginal; // B_p₀, o M en un préstamo nuevo (A.1)
          for (const fila of bancoAgricola.proyectar(c, pagos)) {
            expect(fila.capital).toBeGreaterThanOrEqual(0);
            expect(fila.saldoInicial).toBe(anterior);
            expect(fila.saldoFinal).toBeLessThanOrEqual(fila.saldoInicial);
            expect(fila.saldoFinal).toBeGreaterThanOrEqual(0);
            anterior = fila.saldoFinal;
          }
        }
      }),
      opciones,
    );
  });
});
