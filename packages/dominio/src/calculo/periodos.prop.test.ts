import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { FechaLocal } from '../valores/fecha-local';
import {
  ciclo,
  duracion,
  estadoDe,
  iniciosDePeriodo,
  periodoDe,
  periodosEntre,
  type VigenciaDeCiclo,
} from './periodos';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const semilla = Number(entorno?.['FC_SEED'] ?? '0');
const opciones = { numRuns: 300, seed: semilla };

const BASE = FechaLocal.desdeTexto('2024-01-01');
const dia = (n: number) => FechaLocal.sumarDias(BASE, n);

// Generador local de vigencias (TA-102 todavía no publicó `@finn/dominio/pruebas`): la primera sin
// límite hacia el pasado y hasta cuatro más con "rige desde" estrictamente creciente y arbitrario,
// a veces separados por pocos días para que una vigencia quede más corta que su primer período.
const vigencias = fc
  .record({
    primera: fc.integer({ min: 1, max: 31 }),
    resto: fc.array(
      fc.record({ d: fc.integer({ min: 1, max: 31 }), salto: fc.integer({ min: 1, max: 120 }) }),
      { maxLength: 4 },
    ),
    desde: fc.integer({ min: 0, max: 200 }),
  })
  .map(({ primera, resto, desde }) => {
    let r = desde;
    const lista: VigenciaDeCiclo[] = [{ diaInicio: primera, rigeDesde: null }];
    for (const { d, salto } of resto) {
      r += salto;
      lista.push({ diaInicio: d, rigeDesde: dia(r) });
    }
    return lista;
  });

const caso = fc.record({
  vs: vigencias,
  desde: fc.integer({ min: 0, max: 400 }),
  largo: fc.integer({ min: 0, max: 500 }),
  hoy: fc.integer({ min: 0, max: 900 }),
});

/** Oráculo por día (01 §4.2 puntos 1 a 3): ¿es `s` el inicio de algún período? */
function esInicio(vs: readonly VigenciaDeCiclo[], s: FechaLocal): boolean {
  const ordenadas = [...vs].sort((a, b) => (a.rigeDesde ?? '').localeCompare(b.rigeDesde ?? ''));
  return ordenadas.some((vi, i) => {
    const r = vi.rigeDesde;
    const siguiente = ordenadas[i + 1]?.rigeDesde ?? null;
    if (r !== null && s === r) return true;
    const dentro = (r === null || r < s) && (siguiente === null || s < siguiente);
    return dentro && FechaLocal.inicioDeMes(s, vi.diaInicio) === s;
  });
}

describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-102 [INV-17, CB-13] inv. 17: con vigencias generadas, los períodos no tienen huecos ni solapamientos y hay exactamente un activo', () => {
    fc.assert(
      fc.property(caso, ({ vs, desde, largo, hoy }) => {
        const c = ciclo(vs);
        const a = dia(desde);
        const b = dia(desde + largo);
        const h = dia(hoy);
        const ps = periodosEntre(c, a, b);

        // Cubren [a, b] sin huecos ni solapamientos.
        const [primero = b, ultimo = a] = [ps.at(0)?.inicio, ps.at(-1)?.fin];
        expect(primero <= a && ultimo >= b).toBe(true);
        ps.forEach((p, i) => {
          expect(p.inicio <= p.fin).toBe(true);
          expect(duracion(p)).toBe(FechaLocal.diasEntre(p.inicio, p.fin) + 1);
          const anterior = ps[i - 1];
          if (anterior !== undefined) expect(p.inicio).toBe(FechaLocal.sumarDias(anterior.fin, 1));
        });

        // Los inicios son exactamente los de la definición, día por día.
        const esperados: FechaLocal[] = [];
        for (let x = a; x <= b; x = FechaLocal.sumarDias(x, 1))
          if (esInicio(vs, x)) esperados.push(x);
        expect(iniciosDePeriodo(c, a, b)).toEqual(esperados);
        expect(ps.map((p) => p.inicio).filter((s) => s >= a)).toEqual(esperados);

        // Transición: empieza en un "rige desde" que no coincide con un inicio de mes de su día.
        for (const p of ps) {
          const vi = vs.find((x) => x.rigeDesde === p.inicio);
          const esperada =
            vi !== undefined && FechaLocal.inicioDeMes(p.inicio, vi.diaInicio) !== p.inicio;
          expect(p.transicion).toBe(esperada);
        }

        // Período de una fecha: el único que la contiene.
        const medio = FechaLocal.sumarDias(a, Math.floor(largo / 2));
        const contienen = ps.filter((p) => p.inicio <= medio && medio <= p.fin);
        expect(contienen).toEqual([periodoDe(c, medio)]);

        // Exactamente un activo: el período de hoy; los anteriores cerrados, los posteriores futuros.
        const alrededor = periodosEntre(c, h < a ? h : a, h > b ? h : b);
        const estados = alrededor.map((p) => estadoDe(p, h));
        expect(estados.filter((e) => e === 'activo')).toHaveLength(1);
        const k = estados.indexOf('activo');
        expect(alrededor[k]).toEqual(periodoDe(c, h));
        expect(estados.slice(0, k).every((e) => e === 'cerrado')).toBe(true);
        expect(estados.slice(k + 1).every((e) => e === 'futuro')).toBe(true);
      }),
      opciones,
    );
  });
});
