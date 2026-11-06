// Las claves de la carga firmada que lee el servidor (04 §9.6, §14.2): se leen del entorno al llamar, nunca al importar.
import { describe, expect, it } from 'vitest';
import { clavesDeConciliacion } from './conciliacion.ts';

describe('claves de la conciliación', () => {
  it('PRU-DOM-CONC-107 la lista k2:…,k1:… se separa por versión y la activa tiene que estar en ella', () => {
    const env = {
      FINN_CONCILIACION_CLAVES: 'k2:AAAA,k1:BBBB',
      FINN_CONCILIACION_CLAVE_ACTIVA: 'k2',
    };
    expect(clavesDeConciliacion(env)).toEqual({ activa: 'k2', claves: { k2: 'AAAA', k1: 'BBBB' } });
    expect(() => clavesDeConciliacion({ ...env, FINN_CONCILIACION_CLAVE_ACTIVA: 'k3' })).toThrow();
    expect(() => clavesDeConciliacion({})).toThrow();
  });
});
