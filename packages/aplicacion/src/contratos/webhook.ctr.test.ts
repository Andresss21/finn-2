// Contrato del cuerpo del webhook (TA-177; 04 §8.1, §8.1.1; BE-59, BE-60, BE-61; V-27). Los 12 cuerpos del
// prototipo (docs/anexos/04-backend-verificacion/t15.ts) contra las `CHECK` de 03 §3.17, sin base: texto de 1 a
// 2.000 caracteres (`char_length`, puntos de código), sin NUL (22021) y remitente no vacío.
import { describe, expect, it } from 'vitest';
import { CUERPOS_V27, cumpleCheck, enc, JSON_CT, SMS } from '../../test/cuerpos-v27.ts';
import { LIMITE_CUERPO_BYTES, leerCuerpo } from './webhook.ts';

describe('PRU-CTR-BAND', () => {
  it('PRU-CTR-BAND-001 [V-27] BE-59, BE-60, BE-61: los 12 cuerpos de V-27 dan la fila que admiten las CHECK de 03 §3.17, con el detalle del cuerpo inválido y el remitente desconocido', () => {
    for (const [nombre, formato, cuerpo, ct, rem, detalle] of CUERPOS_V27) {
      const r = leerCuerpo(cuerpo, ct, rem, formato);
      expect({ nombre, cumple: cumpleCheck(r) }).toEqual({ nombre, cumple: true });
      if (detalle === null) {
        expect(r).toEqual({ valido: true, texto: SMS, remitente: 'BAC' });
      } else {
        expect({ nombre, valido: r.valido, detalle: r.valido ? null : r.detalle }).toEqual({
          nombre,
          valido: false,
          detalle,
        });
        expect(r.remitente).toBe('desconocido');
      }
    }
    // BE-60: el crudo se guarda decodificado sin NUL, con U+FFFD por los bytes inválidos y recortado a 2.000
    const crudo = (i: number) =>
      leerCuerpo(CUERPOS_V27[i]?.[2] ?? new Uint8Array(0), JSON_CT, null, 'json').texto;
    expect(crudo(3)).toBe('(cuerpo vacío)');
    expect(Array.from(crudo(4))).toHaveLength(2000);
    expect(crudo(5)).toBe('{"texto":"ab"');
    expect(crudo(6)).toBe('{��}');
    // Campos extra: se ignoran; remitente con control y espacios: limpio; más de 100 o vacío: esquema
    const json = (o: unknown) => leerCuerpo(enc(JSON.stringify(o)), JSON_CT, null, 'json');
    expect(json({ texto: 'x', remitente: ' BAC\u0007 ', sms: 'y' })).toEqual({
      valido: true,
      texto: 'x',
      remitente: 'BAC',
    });
    expect(json({ texto: 'x', remitente: 'r'.repeat(101) })).toMatchObject({ detalle: 'esquema' });
    expect(json({ texto: 'x'.repeat(2001), remitente: 'BAC' })).toMatchObject({
      detalle: 'esquema',
    });
    expect(json(['x'])).toMatchObject({ detalle: 'esquema' });
    expect(LIMITE_CUERPO_BYTES).toBe(16 * 1024);
  });
});
