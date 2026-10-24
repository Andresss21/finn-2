// Un solo archivo con todos los proyectos de Vitest (07 §2.3). `pnpm test` corre lo que no necesita Docker.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { fijarSemilla } from './tools/pruebas/semilla.ts';

const raiz = fileURLToPath(new URL('.', import.meta.url));

// FC_SEED desde el número de corrida (07 §7.1); se imprime una vez, en el proceso principal.
const semilla = fijarSemilla();
if (process.env['VITEST_WORKER_ID'] === undefined && process.env['VITEST_POOL_ID'] === undefined) {
  console.log(`FC_SEED=${semilla} (reproducir: FC_SEED=${semilla} pnpm test:unidad -t <id>)`);
}

// Cobertura de ramas de @finn/dominio (07 §8, DP-09): activa solo cuando el paquete ya tiene código
// (algo más que el index vacío y las pruebas).
function tieneCodigo(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).some(
    (f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f) && !/(^|[\\/])index\.ts$/.test(f),
  );
}
const dominioTieneCodigo = tieneCodigo(join(raiz, 'packages', 'dominio', 'src'));

const comun = { retries: 0 } as const;
const excluidos = ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.claude/**'];
const orden = { shuffle: true, seed: semilla } as const;

export default defineConfig({
  test: {
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      enabled: dominioTieneCodigo,
      include: ['packages/dominio/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { branches: 90 },
    },
    projects: [
      {
        extends: false,
        test: {
          ...comun,
          name: 'unidad',
          include: [
            'packages/*/src/**/*.test.ts',
            'tools/lint/**/*.test.ts',
            'tools/pruebas/**/*.test.ts',
          ],
          exclude: [...excluidos, '**/*.ctr.test.ts', '**/*.int.test.ts', '**/*.rh.test.ts'],
          sequence: orden,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          name: 'escenarios-motor',
          // Los datos viven en escenarios/datos/esc-nn.ts; el ejecutor `motor` los recorre.
          include: ['packages/dominio/escenarios/**/*.motor.test.ts'],
          exclude: excluidos,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          name: 'contratos',
          include: ['packages/aplicacion/src/**/*.ctr.test.ts', 'apps/web/src/**/*.ctr.test.ts'],
          exclude: excluidos,
          sequence: orden,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          name: 'integracion',
          include: [
            'packages/aplicacion/test/**/*.int.test.ts',
            'packages/db/test/**/*.int.test.ts',
            'apps/web/src/app/api/**/*.rh.test.ts',
          ],
          exclude: excluidos,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          name: 'componentes',
          include: ['apps/web/src/**/*.cmp.test.tsx'],
          exclude: excluidos,
          // CT-04: modo navegador con el Chromium de Playwright, sin servidor ni base.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
