import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { saldo } from '../calculo/saldos';
import { hechosArb } from '../pruebas/generadores';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { detalleCuenta } from './detalle-cuenta';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1) y FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const HOY = FechaLocal.desdeTexto('2027-12-31');

describe('PRU-PROP-CTA', () => {
  it('PRU-PROP-CTA-101 [CA-52.1, INV-04] el saldo de cada cuenta es exactamente la suma de sus efectos y el saldoDespues del último movimiento es ese saldo, también al recorrer todas las páginas', () => {
    fc.assert(
      fc.property(hechosArb(HOY), (h) => {
        const i = calcular(h, HOY);
        for (const k of h.cuentas) {
          const suma = h.efectos
            .filter((e) => e.cuentaId === k.id)
            .reduce((s, e) => Centavos.sumar(s, e.monto), Centavos.cero);
          const primera = detalleCuenta(i, k.id, { limite: 100 });
          expect(primera.saldo).toBe(suma);
          expect(primera.saldo).toBe(saldo(h, k.id));

          // Todas las páginas, de la más reciente a la más antigua
          const movimientos = [...primera.movimientos];
          let cursor = primera.siguienteCursor;
          while (cursor !== undefined) {
            const pagina = detalleCuenta(i, k.id, { limite: 100, cursor });
            movimientos.push(...pagina.movimientos);
            cursor = pagina.siguienteCursor;
          }
          const ultimo = movimientos[0]; // el más reciente
          if (ultimo === undefined) expect(suma).toBe(Centavos.cero);
          else expect(ultimo.saldoDespues).toBe(suma);
          // Coherente entre movimientos: lo que sigue menos su efecto es lo que había antes
          movimientos.forEach((m, n) => {
            const anterior = movimientos[n + 1];
            expect(anterior === undefined ? Centavos.cero : anterior.saldoDespues).toBe(
              Centavos.restar(m.saldoDespues, m.efectoEnCuenta),
            );
          });
          expect(
            movimientos.reduce((s, m) => Centavos.sumar(s, m.efectoEnCuenta), Centavos.cero),
          ).toBe(suma);
        }
      }),
      opciones,
    );
  });
});
