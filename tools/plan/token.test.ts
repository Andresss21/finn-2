// Pruebas de tools/plan/token.ts (TA-010, TU-20): lectura del vencimiento del token, sin red ni reloj de pared.
import { describe, expect, it } from 'vitest';
import { diasHasta } from './token.ts';

describe('token: vencimiento (TU-20)', () => {
  const hoy = new Date('2027-01-01T00:00:00Z');

  it('lee la cabecera con desplazamiento y con UTC', () => {
    expect(
      diasHasta('github-authentication-token-expiration: 2027-01-15 06:00:00 -0600\r\n', hoy),
    ).toBe(14);
    expect(diasHasta('Github-Authentication-Token-Expiration: 2027-03-01 00:00:00 UTC', hoy)).toBe(
      59,
    );
  });

  it('sin la cabecera no inventa una fecha', () => {
    expect(diasHasta('HTTP/2.0 200 OK\r\n', hoy)).toBeNull();
  });
});
