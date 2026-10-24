import { describe, expect, it } from 'vitest';
import { CASOS } from '../pruebas/sinteticos/casos';
import { F1_BAC, F2_AGRICOLA, FORMATOS } from '../pruebas/sinteticos/formatos';
import { interpretar, normalizarFecha, normalizarMonto, probar } from './index';

describe('PRU-DOM-BAND', () => {
  it('PRU-DOM-BAND-001 [V-23, PR-2] intérprete de SMS: los 13 sintéticos con su resultado, coincidencia doble y límite de 640 caracteres', () => {
    expect(CASOS).toHaveLength(13);

    // Los 13 SMS de 04 §8.3 contra los tres formatos de 03 §9.5.
    for (const caso of CASOS) {
      const r = interpretar(caso.texto, FORMATOS);
      const e = caso.esperado;
      if ('reconocido' in e) {
        expect(r.resultado, caso.id).toBe('reconocido');
        if (r.resultado !== 'reconocido') continue;
        expect(r.formato.id, caso.id).toBe(e.reconocido);
        expect(r.coincidentes, caso.id).toEqual([e.reconocido]);
        expect(r.campos.monto, caso.id).toBe(e.monto);
        expect(r.campos.comercio, caso.id).toBe(e.comercio);
        expect(r.campos.fecha, caso.id).toBe(e.fecha);
        if (e.ultimos4 !== undefined) expect(r.campos.ultimos4, caso.id).toBe(e.ultimos4);
      } else {
        expect(r, caso.id).toEqual({
          resultado: 'no_reconocido',
          coincidentes: e.coincidentes,
          motivo: e.noReconocido,
        });
      }
    }

    // S-05..S-08: qué paso rechazó cada SMS (nunca un monto o una fecha erróneos).
    const f1 = FORMATOS.find((f) => f.id === F1_BAC);
    if (f1 === undefined) throw new Error('falta F-1');
    const porId = (id: string): string => {
      const caso = CASOS.find((c) => c.id === id);
      if (caso === undefined) throw new Error(id);
      return caso.texto;
    };
    expect(probar(f1, porId('S-05')).fallo).toBe('monto');
    expect(probar(f1, porId('S-06')).fallo).toBe('monto');
    expect(probar(f1, porId('S-07')).fallo).toBe('monto');
    expect(probar(f1, porId('S-08')).fallo).toBe('fecha');
    expect(probar(f1, porId('S-11')).fallo).toBe('patron');
    expect(probar(f1, porId('S-01')).grupos?.['ultimos4']).toBe('1234');

    // Solo se evalúan los formatos activos: sin F-2, S-10 deja de ser doble y F-1 lo reconoce.
    const sinF2 = FORMATOS.map((f) => (f.id === F2_AGRICOLA ? { ...f, activo: false } : f));
    const s10 = interpretar(porId('S-10'), sinF2);
    expect(s10.resultado).toBe('reconocido');
    expect(interpretar(porId('S-10'), [])).toEqual({
      resultado: 'no_reconocido',
      coincidentes: [],
      motivo: 'ninguno',
    });

    // PR-2: más de 640 caracteres → no se evalúa ningún patrón.
    const base = 'VISA 1234: has realizado una compra por USD 1.00 en el comercio ';
    const fecha = ' 2026/10/12';
    const justo = base + 'A'.repeat(640 - base.length - fecha.length) + fecha;
    expect(justo).toHaveLength(640);
    expect(interpretar(justo, FORMATOS).resultado).toBe('reconocido');
    const largo = justo + ' ';
    expect(largo).toHaveLength(641);
    expect(interpretar(largo, FORMATOS)).toEqual({
      resultado: 'no_reconocido',
      coincidentes: [],
      motivo: 'demasiado_largo',
    });
    // Se cuentan caracteres, no unidades UTF-16: 400 emojis son 800 unidades pero 400 caracteres.
    const emojis = '😀'.repeat(400);
    expect(emojis).toHaveLength(800);
    expect(interpretar(emojis, FORMATOS)).toMatchObject({ motivo: 'ninguno' });
    expect(interpretar('😀'.repeat(641), FORMATOS)).toMatchObject({ motivo: 'demasiado_largo' });

    // Normalizadores (03 §7.6): separadores del formato, límites y fechas.
    expect(normalizarMonto('1,234.50', ',', '.')).toBe(123_450);
    expect(normalizarMonto('1.234,50', '.', ',')).toBe(123_450);
    expect(normalizarMonto('7,5', '', ',')).toBe(750);
    expect(normalizarMonto('0012.5', ',', '.')).toBe(1250);
    expect(normalizarMonto('21,474,836.47', ',', '.')).toBe(2_147_483_647);
    expect(normalizarMonto('21,474,836.48', ',', '.')).toBeNull();
    expect(normalizarMonto('123456789', '', '.')).toBeNull();
    expect(normalizarMonto('', ',', '.')).toBeNull();
    expect(normalizarFecha('12/10/2026', ['DD/MM/AAAA'])).toBe('2026-10-12');
    expect(normalizarFecha('2024/02/29', ['AAAA/MM/DD'])).toBe('2024-02-29');
    expect(normalizarFecha('2026/02/29', ['AAAA/MM/DD'])).toBeNull();
    expect(normalizarFecha('20261301', ['AAAAMMDD'])).toBeNull();
    expect(normalizarFecha('2026-10-12', ['AAAA/MM/DD'])).toBeNull();
    // Se prueba cada formato en orden: el primero que da una fecha válida gana.
    expect(normalizarFecha('2026-10-12', ['AAAA/MM/DD', 'AAAA-MM-DD'])).toBe('2026-10-12');

    // Un patrón que no compila no coincide y no rompe a los demás formatos.
    const roto = { ...f1, id: 'roto', patron: '(' };
    expect(probar(roto, porId('S-01'))).toEqual({ coincide: false, fallo: 'patron' });
    expect(interpretar(porId('S-01'), [roto, ...FORMATOS]).resultado).toBe('reconocido');
  });
});
