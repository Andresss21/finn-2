import { describe, expect, it } from 'vitest';
import { F1_BAC, F2_AGRICOLA, F3_CUSCATLAN, FORMATOS } from '../pruebas/sinteticos/formatos';
import { validarFormato, type FormatoSms } from './index';

const base = FORMATOS[0];
if (base === undefined) throw new Error('faltan los formatos de 03 §9.5');

const con = (cambios: Partial<FormatoSms>): FormatoSms => ({
  ...base,
  formatosFecha: [],
  ...cambios,
});

describe('PRU-DOM-BAND', () => {
  it('PRU-DOM-BAND-002 [V-24] BE-46: política de patrones: tres controles exponenciales, F-1..F-3 de 03 §9.5 rechazados, grado ≤ 2 aceptado y las verificaciones previas de 04 §8.5', () => {
    // Tres patrones exponenciales de control (V-24): se detectan y se rechazan con la cadena de ataque.
    for (const patron of [
      String.raw`^(?<ultimos4>\d{4}) (?<monto>(?:\d+)+)$`,
      String.raw`^(?<ultimos4>\d{4}) (?<monto>(?:\d|\d)*)$`,
      String.raw`^(?<ultimos4>\d{4}) (?<monto>(?:\d|\d\d)+)$`,
    ]) {
      const v = validarFormato(con({ patron }));
      expect(v, patron).toMatchObject({
        valido: false,
        error: 'patron_lento',
        grado: 'exponencial',
      });
      if (v.valido || v.error !== 'patron_lento') continue;
      expect(v.ataque, patron).not.toBe('');
    }

    // Los tres patrones sembrados de 03 §9.5 no pasan (BE-46). F-1 y F-2: grado 3, como mide V-24.
    const porId = new Map(FORMATOS.map((f) => [f.id, f]));
    for (const id of [F1_BAC, F2_AGRICOLA]) {
      const f = porId.get(id);
      if (f === undefined) throw new Error(id);
      expect(validarFormato(f), f.nombre).toMatchObject({
        valido: false,
        error: 'patron_lento',
        grado: 3,
      });
    }
    // F-3: con checker 'auto' y 10 s, recheck 4.5 no termina en Node 24 (unknown, grado null), y sin
    // límite da grado 4; en ningún caso pasa.
    const f3 = porId.get(F3_CUSCATLAN);
    if (f3 === undefined) throw new Error(F3_CUSCATLAN);
    const v3 = validarFormato(f3);
    expect(v3).toMatchObject({ valido: false, error: 'patron_lento' });
    if (!v3.valido && v3.error === 'patron_lento' && v3.grado !== null)
      expect(v3.grado === 'exponencial' || v3.grado >= 3).toBe(true);

    // Grado 3 de control rechazado; seguro y grado 2 aceptados.
    expect(
      validarFormato(con({ patron: String.raw`^(?<ultimos4>\d{4}) (?<monto>\d*)\d*\d*x$` })),
    ).toMatchObject({
      valido: false,
      error: 'patron_lento',
      grado: 3,
    });
    expect(validarFormato(con({ patron: String.raw`^(?<ultimos4>\d{4}) (?<monto>\d+)$` }))).toEqual(
      {
        valido: true,
        grado: 1,
      },
    );
    expect(
      validarFormato(
        con({ patron: String.raw`^(?<ultimos4>\d{4}) USD(?<monto>[\d,]+) (?<comercio>.*?) *x$` }),
      ),
    ).toEqual({ valido: true, grado: 2 });

    // Verificaciones previas a recheck (04 §8.5).
    const seguro = String.raw`^(?<ultimos4>\d{4}) (?<monto>\d+)`;
    expect(validarFormato(con({ patron: '(?<ultimos4>\\d{4}' }))).toEqual({
      valido: false,
      error: 'patron_invalido',
    });
    expect(validarFormato(con({ patron: seguro, banderas: 'gi' }))).toEqual({
      valido: false,
      error: 'banderas_no_permitidas',
    });
    expect(validarFormato(con({ patron: seguro, banderas: 'mi' }))).toEqual({
      valido: false,
      error: 'banderas_no_permitidas',
    });
    expect(validarFormato(con({ patron: String.raw`^(?<ultimos4>\d{4}) \d+` }))).toEqual({
      valido: false,
      error: 'grupos_obligatorios',
    });
    // `fecha` presente ⇔ formatos_fecha no vacío (03 §3.21), en los dos sentidos.
    expect(
      validarFormato(con({ patron: `${seguro} (?<fecha>\\d{8})`, formatosFecha: [] })),
    ).toEqual({ valido: false, error: 'grupos_obligatorios' });
    expect(validarFormato(con({ patron: seguro, formatosFecha: ['AAAAMMDD'] }))).toEqual({
      valido: false,
      error: 'grupos_obligatorios',
    });
    expect(
      validarFormato(con({ patron: `${seguro} (?<fecha>\\d{8})$`, formatosFecha: ['AAAAMMDD'] })),
    ).toEqual({ valido: true, grado: 1 });
    // Un `(?<monto>` escapado no es un grupo.
    expect(validarFormato(con({ patron: String.raw`^(?<ultimos4>\d{4}) \(?<monto>` }))).toEqual({
      valido: false,
      error: 'grupos_obligatorios',
    });
  }, 60_000);
});
