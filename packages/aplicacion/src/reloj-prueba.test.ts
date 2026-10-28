// PRU-SEG-RELOJ-002 (V7-07; 07 §4.3, barrera 2; CT-01): `relojDePrueba()` en proceso, con los 11 casos de
// PRU-SEG-RELOJ-001. El archivo de reloj "llega por otra vía": en todos los casos `FINN_RELOJ_ARCHIVO` apunta
// a un archivo válido (como en el prototipo verificado, docs/anexos/07-pruebas-verificacion/…/seg/barreras.mjs).
import { describe, expect, it } from 'vitest';
import {
  hayVariableDeReloj,
  relojDePrueba,
  relojPermitido,
  type FuentesDeReloj,
} from './reloj-prueba.ts';

const ARCHIVO = '/pruebas/finn-reloj-seg.json';
const FIJADO_EN = Date.parse('2026-10-28T15:00:00.000Z');
const INSTANTE = '2027-02-20T12:00:00-06:00';
const fuentes = (contenido: string, pasaronMs = 0): FuentesDeReloj => ({
  leerArchivo: (ruta) => {
    if (ruta !== ARCHIVO) throw Object.assign(new Error(`no existe ${ruta}`), { code: 'ENOENT' });
    return contenido;
  },
  ahoraMs: () => FIJADO_EN + pasaronMs,
});
const valido = fuentes(JSON.stringify({ instante: INSTANTE, fijadoEn: FIJADO_EN }), 5_000);

type Esperado = 'reloj-prueba' | 'null';
const CASOS: readonly [string, Record<string, string>, Esperado][] = [
  [
    'control positivo: FINN_ENTORNO=pruebas, sin VERCEL_ENV',
    { FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'reloj-prueba',
  ],
  [
    'VERCEL_ENV=production',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'production', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'null',
  ],
  [
    'VERCEL_ENV=preview',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'null',
  ],
  [
    'VERCEL_ENV=development',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'development', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'null',
  ],
  [
    'VERCEL_ENV vacía',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: '', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'null',
  ],
  ['sin FINN_ENTORNO', { FINN_RELOJ_ARCHIVO: ARCHIVO }, 'null'],
  ['FINN_ENTORNO=produccion', { FINN_ENTORNO: 'produccion', FINN_RELOJ_ARCHIVO: ARCHIVO }, 'null'],
  [
    'FINN_ENTORNO=Pruebas (mayúscula)',
    { FINN_ENTORNO: 'Pruebas', FINN_RELOJ_ARCHIVO: ARCHIVO },
    'null',
  ],
  ['solo FINN_HOY_SIMULADO, sin FINN_ENTORNO', { FINN_HOY_SIMULADO: '2027-02-20' }, 'null'],
  [
    'FINN_RELOJ_ARCHIVO vacía, VERCEL_ENV=preview',
    { VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: '' },
    'null',
  ],
  ['control: VERCEL_ENV=preview sin variables de reloj', { VERCEL_ENV: 'preview' }, 'null'],
];

describe('PRU-SEG-RELOJ', () => {
  it('PRU-SEG-RELOJ-002 CT-01, CT-01-funcion: relojDePrueba() devuelve el reloj solo con FINN_ENTORNO=pruebas y sin VERCEL_ENV, y null en los otros 10 de los 11 casos de 07 §4.3, aunque el archivo exista', () => {
    expect(CASOS).toHaveLength(11);
    const obtenidos = CASOS.map(([nombre, extra]) => {
      const r = relojDePrueba({ ...extra, FINN_RELOJ_ARCHIVO: ARCHIVO }, valido);
      return [nombre, r ? 'reloj-prueba' : 'null'];
    });
    expect(obtenidos).toEqual(CASOS.map(([nombre, , esperado]) => [nombre, esperado]));

    // La regla vive en relojPermitido() (sin E/S): solo el control positivo la cumple.
    expect(CASOS.map(([, extra]) => relojPermitido(extra))).toEqual(
      CASOS.map(([, , e]) => e === 'reloj-prueba'),
    );
    // La barrera 1 (Parte C) no arranca en los 9 casos prohibidos: permitido falso y alguna variable de reloj,
    // aunque esté vacía. Los dos controles (positivo y preview sin variables) sí arrancan.
    const noArranca = CASOS.map(([, extra]) => !relojPermitido(extra) && hayVariableDeReloj(extra));
    expect(noArranca.filter(Boolean)).toHaveLength(9);
    expect([noArranca[0], noArranca[10]]).toEqual([false, false]);

    // El control positivo da la forma que esperan escribir() y leer() (RelojTx): el reloj avanza con el real
    // (simulado = real + (instante − fijadoEn), 07 §4.1) y `hoy` es la fecha en America/El_Salvador.
    const r = relojDePrueba({ FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: ARCHIVO }, valido);
    expect(r).toEqual({ hoy: '2027-02-20', desfaseMs: Date.parse(INSTANTE) - FIJADO_EN });
    // 23:59:59 locales siguen siendo el 20; un segundo después es el 21 (la medianoche no es la de UTC).
    const casiMedianoche = fuentes(
      JSON.stringify({ instante: '2027-02-20T23:59:59-06:00', fijadoEn: FIJADO_EN }),
      0,
    );
    const permitido = { FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: ARCHIVO };
    expect(relojDePrueba(permitido, casiMedianoche)?.hoy).toBe('2027-02-20');
    const medianoche = fuentes(
      JSON.stringify({ instante: '2027-02-20T23:59:59-06:00', fijadoEn: FIJADO_EN }),
      1_000,
    );
    expect(relojDePrueba(permitido, medianoche)?.hoy).toBe('2027-02-21');

    // Permitido pero sin archivo (todavía no lo escribió la prueba, o la variable falta): reloj real.
    expect(
      relojDePrueba({ FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: '/otro.json' }, valido),
    ).toBeNull();
    expect(relojDePrueba({ FINN_ENTORNO: 'pruebas' }, valido)).toBeNull();
    // Un archivo malformado no cae en silencio al reloj real: falla la petición.
    expect(() => relojDePrueba(permitido, fuentes('{"instante":"ayer","fijadoEn":1}'))).toThrow(
      /reloj de prueba/i,
    );
    expect(() => relojDePrueba(permitido, fuentes('no es json'))).toThrow(/reloj de prueba/i);
    expect(() =>
      relojDePrueba(permitido, fuentes(JSON.stringify({ instante: INSTANTE, fijadoEn: 1.5 }))),
    ).toThrow(/reloj de prueba/i);
    // Prohibido: ni siquiera lee el archivo.
    const leidas: string[] = [];
    relojDePrueba(
      { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: ARCHIVO },
      {
        ...valido,
        leerArchivo: (ruta) => (leidas.push(ruta), valido.leerArchivo(ruta)),
      },
    );
    expect(leidas).toEqual([]);
  });
});
