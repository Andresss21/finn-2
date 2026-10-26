import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Centavos } from '../../valores/centavos';
import { type Medio, proyeccionDelCierre, repartir, ritmoDeCategoria } from './ritmo';

// 300 casos en PR (07 §1.1); FC_RUNS=20000 en el nocturno (V6-02). La semilla la fija vitest.config.ts.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const c = Centavos.desdeEntero;
const suma = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

interface Consumo {
  readonly dia: number;
  readonly monto: number;
  readonly medio: Medio;
  readonly programada: boolean;
}

const caso = fc
  .record({
    dur: fc.constantFrom(11, 28, 29, 30, 31),
    posicion: fc.double({ min: 0, max: 1, noNaN: true }),
    tarjetas: fc.integer({ min: 0, max: 3 }),
    fondo: fc.integer({ min: -5000, max: 80000 }),
  })
  .chain(({ dur, posicion, tarjetas, fondo }) => {
    const dt = 1 + Math.floor(posicion * (dur - 1));
    const medios = ['debito', ...['t1', 't2', 't3'].slice(0, tarjetas)];
    const medio = fc.constantFrom(...medios);
    return fc.record({
      dt: fc.constant(dt),
      dr: fc.constant(dur - dt),
      tarjetas: fc.constant(medios.slice(1)),
      fondo: fc.constant(fondo),
      consumos: fc.array(
        fc.record({
          dia: fc.integer({ min: 1, max: dt }),
          monto: fc.integer({ min: 1, max: 50000 }),
          medio,
          programada: fc.double({ min: 0, max: 1, noNaN: true }).map((x) => x < 0.1),
        }),
        { maxLength: 12 },
      ),
      pendientes: fc.array(fc.record({ monto: fc.integer({ min: 1, max: 20000 }), medio }), {
        maxLength: 2,
      }),
    });
  });

/** Entrada de `ritmoDeCategoria` y el reparto D2 simplificado de 01 §4.5 (SobT por tarjeta, SobD). */
function armar(k: {
  dt: number;
  dr: number;
  fondo: number;
  consumos: readonly Consumo[];
  pendientes: readonly { monto: number; medio: Medio }[];
}) {
  const disp = k.fondo - suma(k.consumos.map((x) => x.monto));
  const sobT = new Map<Medio, number>();
  let resto = k.fondo;
  for (const x of [...k.consumos].sort((a, b) => a.dia - b.dia)) {
    const cubierto = Math.max(0, Math.min(x.monto, resto));
    resto -= cubierto;
    if (x.monto > cubierto && x.medio !== 'debito')
      sobT.set(x.medio, (sobT.get(x.medio) ?? 0) + x.monto - cubierto);
  }
  const sobTotal = disp < 0 ? -disp : 0;
  const sobTarjeta = suma([...sobT.values()]);
  const entrada = (consumos: readonly Consumo[], dr = k.dr) => ({
    disponible: c(disp),
    fondo: c(k.fondo),
    variables: consumos
      .filter((x) => !x.programada)
      .map((x) => ({ monto: c(x.monto), medio: x.medio })),
    pendientes: k.pendientes.map((x) => ({ monto: c(x.monto), medio: x.medio })),
    diasTranscurridos: k.dt,
    diasRestantes: dr,
  });
  return { disp, sobT, sobTotal, sobTarjeta, sobD: sobTotal - sobTarjeta, entrada };
}

describe('PRU-PROP-REP', () => {
  // Plazo propio: el nocturno corre 20.000 casos (mismo criterio que PRU-PROP-MOTOR-105).
  it('PRU-PROP-REP-002 [V6-02] ritmo y proyección: determinista, exceso mínimo, futuro exacto y no negativo, monótono en los días restantes, reparto exacto y conservación del exceso', () => {
    fc.assert(
      fc.property(caso, (k) => {
        const a = armar(k);
        const r = ritmoDeCategoria(a.entrada(k.consumos));
        expect(ritmoDeCategoria(a.entrada([...k.consumos].reverse()))).toEqual(r);
        expect(r.exceso).toBeGreaterThanOrEqual(Math.max(0, -a.disp));
        expect(suma([...r.futuro.values()])).toBe(r.proyeccionVariable + r.programadasPendientes);
        expect([...r.futuro.values()].every((v) => v >= 0)).toBe(true);
        if (k.dr > 0)
          expect(ritmoDeCategoria(a.entrada(k.consumos, k.dr - 1)).exceso).toBeLessThanOrEqual(
            r.exceso,
          );
        // Proyección del cierre de una sola categoría.
        const adicional = repartir(c(r.exceso - (a.sobD + a.sobTarjeta)), r.futuro);
        expect(suma([...adicional.values()])).toBe(r.exceso - (a.sobD + a.sobTarjeta));
        const sinReservar = new Map([...a.sobT].map(([t, v]) => [t, c(v)]));
        const p = proyeccionDelCierre(
          [
            {
              disponibleProyectado: r.disponibleProyectado,
              sobregiroDebito: c(a.sobD),
              adicional,
            },
          ],
          sinReservar,
          [],
        );
        expect(p.reduccionLpa).toBeGreaterThanOrEqual(a.sobD);
        expect(suma([...p.faltaReservar.values()]) - a.sobTarjeta + (p.reduccionLpa - a.sobD)).toBe(
          r.exceso - (a.sobD + a.sobTarjeta),
        );
      }),
      opciones,
    );
  }, 120_000);

  it('PRU-PROP-REP-002 [V6-02] repartir: suma exacta, partes positivas y orden de entrada irrelevante', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_000_000 }),
        fc.array(fc.integer({ min: 0, max: 5_000_000 }), { minLength: 1, maxLength: 4 }),
        (monto, pesos) => {
          const m = new Map<Medio, Centavos>(
            pesos.map((p, n) => [n === 0 ? 'debito' : `t${n}`, c(p)]),
          );
          const parte = repartir(c(monto), m);
          const hay = suma(pesos) > 0;
          expect(suma([...parte.values()])).toBe(hay ? monto : 0);
          expect([...parte.values()].every((v) => v > 0)).toBe(true);
          expect(repartir(c(monto), new Map([...m].reverse()))).toEqual(parte);
        },
      ),
      opciones,
    );
  });
});
