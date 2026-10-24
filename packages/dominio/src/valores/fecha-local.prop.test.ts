import { Temporal } from '@js-temporal/polyfill';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { FechaLocal } from './index';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const semilla = Number(entorno?.['FC_SEED'] ?? '0');
const opciones = { numRuns: 300, seed: semilla };

const EPOCA = Temporal.PlainDate.from('1970-01-01');
const MINIMA = Temporal.PlainDate.from('0000-01-01');
const MAXIMA = Temporal.PlainDate.from('9999-12-31');
const DIA_MIN = EPOCA.until(MINIMA).days;
const DIA_MAX = EPOCA.until(MAXIMA).days;

const enRango = (p: Temporal.PlainDate) =>
  Temporal.PlainDate.compare(p, MINIMA) >= 0 && Temporal.PlainDate.compare(p, MAXIMA) <= 0;

// Fechas del rango completo, con más peso cerca de los bordes de mes y de los 29 de febrero.
const plana = fc.oneof(
  fc.integer({ min: DIA_MIN, max: DIA_MAX }).map((d) => EPOCA.add({ days: d })),
  fc
    .record({ y: fc.integer({ min: 0, max: 9999 }), m: fc.integer({ min: 1, max: 12 }) })
    .chain(({ y, m }) => {
      const mes = Temporal.PlainYearMonth.from({ year: y, month: m });
      return fc
        .integer({ min: mes.daysInMonth - 3, max: mes.daysInMonth })
        .map((d) => mes.toPlainDate({ day: d }));
    }),
  fc
    .integer({ min: 0, max: 2499 })
    .map((k) => Temporal.PlainDate.from({ year: k * 4, month: 2, day: 29 })),
);
const comoFecha = (p: Temporal.PlainDate) => FechaLocal.desdeTexto(p.toString());

/** Lo que diga Temporal, o que la operación propia lance si el resultado sale del rango. */
function igualQueTemporal(propia: () => FechaLocal, oraculo: () => Temporal.PlainDate) {
  const esperada = oraculo();
  if (enRango(esperada)) expect(propia()).toBe(esperada.toString());
  else expect(propia).toThrow(RangeError);
}

describe('PRU-PROP-VAL', () => {
  it('PRU-PROP-VAL-101 [ADR-16, RT-08, 01 §4.2.1, 01 §4.12] FechaLocal frente a Temporal.PlainDate: días, inicio de mes, meses y años con recorte', () => {
    // Validación: acepta exactamente las fechas que existen.
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999 }),
        fc.integer({ min: 0, max: 13 }),
        fc.integer({ min: 0, max: 32 }),
        (y, m, d) => {
          const texto = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          let existe = true;
          try {
            Temporal.PlainDate.from({ year: y, month: m, day: d }, { overflow: 'reject' });
          } catch {
            existe = false;
          }
          if (existe) expect(FechaLocal.desdeTexto(texto)).toBe(texto);
          else expect(() => FechaLocal.desdeTexto(texto)).toThrow(RangeError);
        },
      ),
      opciones,
    );

    // Partes, días del mes, sumar días y días entre fechas.
    fc.assert(
      fc.property(plana, plana, fc.integer({ min: -1_000_000, max: 1_000_000 }), (p, q, n) => {
        const f = comoFecha(p);
        const g = comoFecha(q);
        expect(FechaLocal.partes(f)).toEqual({ anio: p.year, mes: p.month, dia: p.day });
        expect(FechaLocal.desdePartes(p.year, p.month, p.day)).toBe(f);
        expect(FechaLocal.diasDelMes(f)).toBe(p.daysInMonth);
        expect(FechaLocal.diasEntre(f, g)).toBe(p.until(q).days);
        expect(FechaLocal.comparar(f, g)).toBe(Temporal.PlainDate.compare(p, q));
        igualQueTemporal(
          () => FechaLocal.sumarDias(f, n),
          () => p.add({ days: n }),
        );
      }),
      opciones,
    );

    // Inicio de mes con recorte (01 §4.2.1): IM(m, d) = fecha(año, mes, mín(d, días del mes)).
    fc.assert(
      fc.property(plana, fc.integer({ min: 1, max: 31 }), (p, d) => {
        expect(FechaLocal.inicioDeMes(comoFecha(p), d)).toBe(p.with({ day: d }).toString());
      }),
      opciones,
    );

    // Sumar meses y años con recorte (29 de febrero → 28).
    fc.assert(
      fc.property(plana, fc.integer({ min: -30_000, max: 30_000 }), (p, n) => {
        const f = comoFecha(p);
        igualQueTemporal(
          () => FechaLocal.sumarMeses(f, n),
          () => p.add({ months: n }),
        );
        igualQueTemporal(
          () => FechaLocal.sumarAnios(f, Math.trunc(n / 6)),
          () => p.add({ years: Math.trunc(n / 6) }),
        );
      }),
      opciones,
    );

    // Casos fijos de 01 §4.12 y entradas inválidas.
    const bisiesto = FechaLocal.desdeTexto('2028-02-29');
    expect(FechaLocal.sumarAnios(bisiesto, 1)).toBe('2029-02-28');
    expect(FechaLocal.sumarAnios(bisiesto, 4)).toBe('2032-02-29');
    expect(FechaLocal.sumarMeses(FechaLocal.desdeTexto('2027-01-31'), 1)).toBe('2027-02-28');
    expect(FechaLocal.inicioDeMes(FechaLocal.desdeTexto('2027-02-10'), 31)).toBe('2027-02-28');
    for (const malo of ['2027-1-01', '2027-01-01T00:00', ' 2027-01-01', '20270101'])
      expect(() => FechaLocal.desdeTexto(malo)).toThrow(RangeError);
    expect(() => FechaLocal.sumarDias(bisiesto, 0.5)).toThrow(RangeError);
    expect(() => FechaLocal.sumarMeses(bisiesto, Number.NaN)).toThrow(RangeError);
    expect(() => FechaLocal.inicioDeMes(bisiesto, 0)).toThrow(RangeError);
    expect(() => FechaLocal.inicioDeMes(bisiesto, 32)).toThrow(RangeError);
  });
});
