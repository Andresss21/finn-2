// `codigoTotp` (05 §14.4): el código actual del usuario de prueba, del secreto que crea tools/pruebas/e2e/usuario.ts.
// FT-02 reemplaza el factor del usuario (inscribe uno nuevo): `guardarSecreto` deja el nuevo en un archivo, atado al
// secreto original de esta pila para que el de una corrida anterior no se confunda con el de esta.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { TOTP } from 'otpauth';

const ARCHIVO = 'test-results/totp-secreto.json';

function secretoVigente(): string {
  const original = process.env['E2E_TOTP_SECRETO'];
  if (!original)
    throw new Error('falta E2E_TOTP_SECRETO: se fija al levantar la pila (pnpm test:e2e)');
  if (!existsSync(ARCHIVO)) return original;
  const guardado = JSON.parse(readFileSync(ARCHIVO, 'utf8')) as {
    original: string;
    actual: string;
  };
  return guardado.original === original ? guardado.actual : original;
}

export const codigoDe = (secreto: string): string => new TOTP({ secret: secreto }).generate();

export const codigoTotp = (): string => codigoDe(secretoVigente());

/** El factor del usuario de prueba pasó a ser otro (FT-02): las demás pruebas deben usar este secreto. */
export function guardarSecreto(actual: string): void {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    ARCHIVO,
    JSON.stringify({ original: process.env['E2E_TOTP_SECRETO'] ?? '', actual }),
  );
}
