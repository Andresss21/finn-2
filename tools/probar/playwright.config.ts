// La siembra de `pnpm probar` corre en Playwright (que carga el TypeScript del ejecutor `int` como en la E2E) sin abrir
// navegador. Se corre desde apps/web (ahí está @playwright/test): ver `servir.mjs`.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerEstado, sinSoloServidor } from '../pruebas/e2e/local.ts';

const estado = leerEstado();
if (estado) Object.assign(process.env, sinSoloServidor(estado.entorno));

export default {
  testDir: dirname(fileURLToPath(import.meta.url)),
  testMatch: 'sembrar.siembra.ts',
  outputDir: fileURLToPath(new URL('../../test-results/probar', import.meta.url)),
  workers: 1,
  retries: 0,
  timeout: 300_000,
  reporter: 'line',
};
