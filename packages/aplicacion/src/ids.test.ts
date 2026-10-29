// Ids de las filas que crea una operación (04 §2.4.1, BE-31; V-19): UUIDv5 con el vector del RFC 9562.
import { describe, expect, it } from 'vitest';
import type { Uuid } from '@finn/dominio';
import { generadorAleatorio, generadorDerivado, uuidv5 } from './ids.ts';

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-002 [V-19] uuidv5 da el vector del RFC 9562 (www.example.com en el espacio DNS); generadorDerivado repite los mismos ids con el mismo principal y generadorAleatorio no', () => {
    // RFC 9562, apéndice A.4
    expect(uuidv5('www.example.com', DNS)).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');

    const principal = '0f6a8f3e-5b1c-4e0a-9a52-0d2a6f0c9e11' as Uuid;
    const ids = (p: Uuid) => {
      const g = generadorDerivado(p);
      return [g.siguiente(), g.siguiente(), g.siguiente()];
    };
    const [a, b, c] = ids(principal) as [Uuid, Uuid, Uuid];
    // índice 1, 2, 3… como nombre y el id principal como espacio de nombres (04 §2.4.1)
    expect(a).toBe(uuidv5('1', principal));
    expect(b).toBe(uuidv5('2', principal));
    expect(c).toBe(uuidv5('3', principal));
    expect(new Set([a, b, c]).size).toBe(3);
    for (const id of [a, b, c]) expect(id).toMatch(UUID);
    expect(id5(a)).toBe('5'); // versión 5
    // previsualizar, confirmar y un reintento producen los mismos ids
    expect(ids(principal)).toEqual([a, b, c]);
    // otro principal, otros ids
    expect(ids('1e6a8f3e-5b1c-4e0a-9a52-0d2a6f0c9e11' as Uuid)).not.toEqual([a, b, c]);

    const alea = generadorAleatorio();
    const [x, y] = [alea.siguiente(), alea.siguiente()];
    expect(x).toMatch(UUID);
    expect(x).not.toBe(y);
    expect(() => uuidv5('1', 'no-es-un-uuid')).toThrow('espacio de nombres');
  });
});

/** El dígito de versión de un UUID. */
const id5 = (u: string): string => u.charAt(14);
