import { describe, expect, it } from 'vitest';
import { endpointCorto } from './endpoint-corto';

describe('endpointCorto', () => {
  it('PRU-DOM-NOTIF-101 dominio y últimos 8 caracteres, sin claves [CH-73, 04 §6.11]', () => {
    expect(endpointCorto('https://push.ejemplo.test/send/abcdefgh12345678')).toBe(
      'push.ejemplo.test…12345678',
    );
    expect(endpointCorto('HTTPS://Push.Ejemplo.test:8443/x?y=1#z')).toBe(
      'push.ejemplo.test:8443…/x?y=1#z',
    );
    expect(endpointCorto('no-es-url-abcdefgh')).toBe('…abcdefgh');
  });
});
