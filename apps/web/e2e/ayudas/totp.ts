// `codigoTotp` (05 §14.4): el código actual del usuario de prueba, del secreto que crea tools/pruebas/e2e/usuario.ts.
import { TOTP } from 'otpauth';

export function codigoTotp(): string {
  const secret = process.env['E2E_TOTP_SECRETO'];
  if (!secret)
    throw new Error('falta E2E_TOTP_SECRETO: se fija al levantar la pila (pnpm test:e2e)');
  return new TOTP({ secret }).generate();
}
