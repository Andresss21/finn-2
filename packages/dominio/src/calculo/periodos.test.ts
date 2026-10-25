import { describe, expect, it } from 'vitest';
import { FechaLocal } from '../valores/fecha-local';
import {
  ciclo,
  duracion,
  estadoDe,
  iniciosDePeriodo,
  iniciosDeVigencia,
  periodoDe,
  periodosEntre,
  type VigenciaDeCiclo,
} from './periodos';

const f = (t: string) => FechaLocal.desdeTexto(t);
const v = (diaInicio: number, rigeDesde: string | null = null): VigenciaDeCiclo => ({
  diaInicio,
  rigeDesde: rigeDesde === null ? null : f(rigeDesde),
});
/** Los períodos como texto 'inicio..fin' (con '*' si es de transición), para comparar de un vistazo. */
const tramos = (c: ReturnType<typeof ciclo>, desde: string, hasta: string) =>
  periodosEntre(c, f(desde), f(hasta)).map(
    (p) => `${p.inicio}..${p.fin}${p.transicion ? '*' : ''}`,
  );

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-102 [INV-17, CB-13] períodos (01 §4.2): días de inicio 1, 21, 29, 30 y 31 con recorte, transición de Q5, período de una fecha, estado y duración', () => {
    // Día 1: meses calendario; febrero bisiesto dura 29.
    const uno = ciclo([v(1)]);
    expect(periodoDe(uno, f('2026-03-15'))).toEqual({
      inicio: '2026-03-01',
      fin: '2026-03-31',
      transicion: false,
    });
    expect(duracion(periodoDe(uno, f('2028-02-10')))).toBe(29);
    expect(duracion(periodoDe(uno, f('2026-02-10')))).toBe(28);
    expect(tramos(uno, '2025-12-31', '2026-01-01')).toEqual([
      '2025-12-01..2025-12-31',
      '2026-01-01..2026-01-31',
    ]);

    // Día 21: el período cruza el mes.
    const veintiuno = ciclo([v(21)]);
    expect(tramos(veintiuno, '2026-02-01', '2026-04-01')).toEqual([
      '2026-01-21..2026-02-20',
      '2026-02-21..2026-03-20',
      '2026-03-21..2026-04-20',
    ]);
    expect(duracion(periodoDe(veintiuno, f('2026-03-05')))).toBe(28);

    // CB-13: 29, 30 y 31 se recortan al último día del mes (supuesto 15).
    expect(tramos(ciclo([v(29)]), '2026-02-01', '2026-03-01')).toEqual([
      '2026-01-29..2026-02-27',
      '2026-02-28..2026-03-28',
    ]);
    expect(tramos(ciclo([v(29)]), '2028-02-29', '2028-03-29')).toEqual([
      '2028-02-29..2028-03-28',
      '2028-03-29..2028-04-28',
    ]);
    expect(tramos(ciclo([v(30)]), '2026-02-01', '2026-03-01')).toEqual([
      '2026-01-30..2026-02-27',
      '2026-02-28..2026-03-29',
    ]);
    const treintaYUno = ciclo([v(31)]);
    expect(tramos(treintaYUno, '2026-02-01', '2026-07-01')).toEqual([
      '2026-01-31..2026-02-27',
      '2026-02-28..2026-03-30',
      '2026-03-31..2026-04-29',
      '2026-04-30..2026-05-30',
      '2026-05-31..2026-06-29',
      '2026-06-30..2026-07-30',
    ]);
    expect(duracion(periodoDe(treintaYUno, f('2026-02-01')))).toBe(28);

    // Q5: el día de inicio cambia de 21 a 1 y la vigencia nueva rige desde el 21 de diciembre.
    const q5 = ciclo([v(1, '2025-12-21'), v(21)]); // el orden de entrada no importa
    expect(tramos(q5, '2025-11-21', '2026-02-28')).toEqual([
      '2025-11-21..2025-12-20',
      '2025-12-21..2025-12-31*',
      '2026-01-01..2026-01-31',
      '2026-02-01..2026-02-28',
    ]);
    const transicion = periodoDe(q5, f('2025-12-25'));
    expect(transicion).toEqual({ inicio: '2025-12-21', fin: '2025-12-31', transicion: true });
    expect(duracion(transicion)).toBe(11);
    expect(iniciosDePeriodo(q5, f('2025-11-01'), f('2026-02-15'))).toEqual([
      '2025-11-21',
      '2025-12-21',
      '2026-01-01',
      '2026-02-01',
    ]);
    expect(iniciosDeVigencia(q5, 0, f('2025-10-01'), f('2026-03-01'))).toEqual([
      '2025-10-21',
      '2025-11-21',
    ]);
    expect(iniciosDeVigencia(q5, 1, f('2025-10-01'), f('2026-02-01'))).toEqual([
      '2025-12-21',
      '2026-01-01',
      '2026-02-01',
    ]);
    expect(() => iniciosDeVigencia(q5, 2, f('2025-10-01'), f('2026-02-01'))).toThrow(RangeError);

    // Una vigencia que rige desde un inicio de su propio día no genera transición; tres vigencias.
    const tres = ciclo([v(15), v(1, '2026-01-01'), v(31, '2026-03-01')]);
    expect(tramos(tres, '2025-12-20', '2026-05-01')).toEqual([
      '2025-12-15..2025-12-31',
      '2026-01-01..2026-01-31',
      '2026-02-01..2026-02-28',
      '2026-03-01..2026-03-30*',
      '2026-03-31..2026-04-29',
      '2026-04-30..2026-05-30',
    ]);
    // Una vigencia corta: la siguiente rige antes del primer inicio propio (punto 4: [s, s′ − 1]).
    const corta = ciclo([v(1), v(10, '2026-01-05'), v(1, '2026-01-08')]);
    expect(tramos(corta, '2026-01-01', '2026-02-01')).toEqual([
      '2026-01-01..2026-01-04',
      '2026-01-05..2026-01-07*',
      '2026-01-08..2026-01-31*',
      '2026-02-01..2026-02-28',
    ]);
    expect(periodosEntre(q5, f('2026-01-02'), f('2026-01-01'))).toEqual([]);

    // Estado (punto 7), con hoy en los dos bordes del activo.
    const marzo = periodoDe(uno, f('2026-03-10'));
    expect(estadoDe(periodoDe(uno, f('2026-02-10')), f('2026-03-01'))).toBe('cerrado');
    expect(estadoDe(marzo, f('2026-03-01'))).toBe('activo');
    expect(estadoDe(marzo, f('2026-03-31'))).toBe('activo');
    expect(estadoDe(marzo, f('2026-04-01'))).toBe('cerrado');
    expect(estadoDe(marzo, f('2026-02-28'))).toBe('futuro');

    // Vigencias inválidas: ninguna, sin la primera, dos primeras, "rige desde" repetido, día fuera de 1–31.
    expect(() => ciclo([])).toThrow(RangeError);
    expect(() => ciclo([v(1, '2026-01-01')])).toThrow(RangeError);
    expect(() => ciclo([v(1), v(2)])).toThrow(RangeError);
    expect(() => ciclo([v(1), v(2, '2026-01-01'), v(3, '2026-01-01')])).toThrow(RangeError);
    expect(() => ciclo([v(0)])).toThrow(RangeError);
    expect(() => ciclo([v(32)])).toThrow(RangeError);
    expect(() => ciclo([v(1.5)])).toThrow(RangeError);
  });
});
