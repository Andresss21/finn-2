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
// Mutantes del motor (07 §19.4, TA-112): FINN_MUTANTE llega a @finn/dominio solo como constante de
// compilación de estos dos proyectos (calculo/mutantes.ts); sin la variable, no se define nada.
const mutante = process.env['FINN_MUTANTE'] ?? '';
const define = mutante === '' ? {} : { __FINN_MUTANTE__: JSON.stringify(mutante) };
const excluidos = ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.claude/**'];
const orden = { shuffle: true, seed: semilla } as const;

// Plazo de los proyectos `unidad` y `escenarios-motor`. Con fast-check sobre `hechosArb` y la
// cobertura v8, el runner de GitHub pasa los 5 s por defecto aunque en el PR haya pasado: run
// 40355731276 de ci.yml en main (0d6128a) y run 40358730586 (52c8be7, PRU-DOM-MOTOR-111, 7348 ms).
// #52 (139fce6) dio 60 s a cinco pruebas, una por una; esto cubre las que vengan. Los plazos propios
// (60 s, 120 s y los 600 s de PRU-PROP-MOTOR-106) son mayores y siguen mandando.
const plazoMotor = 30_000;

// Pruebas que ejecutan `recheck` (04 §8.5). Su fuzzer usa subtiempos de reloj (ataque, incubación,
// siembra) y con la CPU ocupada estima mal el grado (devuelve 3 para un patrón de grado 2). Por eso
// viven en su propio proyecto, que `tools/pruebas/vitest.mjs` corre después del resto y de a un archivo.
const PRUEBAS_RECHECK = [
  'packages/sms/src/validar-formato.test.ts',
  'tools/ci/formatos-bac.test.ts',
];

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
        define,
        test: {
          ...comun,
          name: 'unidad',
          testTimeout: plazoMotor,
          include: [
            'packages/*/src/**/*.test.ts',
            'apps/web/src/**/*.test.ts',
            'tools/ci/**/*.test.ts',
            'tools/db/**/*.test.ts',
            'tools/lint/**/*.test.ts',
            'tools/plan/**/*.test.ts',
            'tools/pruebas/**/*.test.ts',
          ],
          // permisos.test.ts corre con `node --test` (pnpm plan:permisos).
          exclude: [
            ...excluidos,
            ...PRUEBAS_RECHECK,
            '**/*.ctr.test.ts',
            '**/*.int.test.ts',
            '**/*.rh.test.ts',
            'tools/plan/permisos.test.ts',
          ],
          sequence: orden,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          name: 'unidad-recheck',
          include: PRUEBAS_RECHECK,
          exclude: excluidos,
          sequence: orden,
        },
      },
      {
        extends: false,
        define,
        test: {
          ...comun,
          name: 'escenarios-motor',
          testTimeout: plazoMotor,
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
            // PRU-SEG-ACCESO-001 (TA-218): recorre las Server Actions y las rutas reales
            'apps/web/src/servidor/**/*.int.test.ts',
            // PRU-SEG-OPER-103 (TA-250): humo.sh contra su propio contenedor; el arnés no lo usa
            'tools/humo/test/**/*.test.ts',
          ],
          exclude: excluidos,
          // Arnés de PostgreSQL (TA-050, 07 §5.2): contenedor, bootstrap y plantilla antes de las suites
          globalSetup: ['packages/db/test/ayudantes/base.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: false,
        test: {
          ...comun,
          // RES (07 §1.1, §19.6; TA-251): el nocturno, con `pnpm test:respaldo`; el mismo arnés de PostgreSQL
          name: 'respaldo',
          include: ['tools/respaldo/test/**/*.test.ts'],
          exclude: excluidos,
          globalSetup: ['packages/db/test/ayudantes/base.ts'],
          testTimeout: 600_000,
          hookTimeout: 1_800_000,
        },
      },
      {
        extends: false,
        // La raíz es apps/web: así Vite resuelve sus dependencias (Radix, axe) y toma su postcss.config.mjs, que carga
        // Tailwind y los tokens como en la aplicación (05 §10.1). Con la caché fría, el prebundle evita que Vite recargue la prueba.
        root: join(raiz, 'apps', 'web'),
        optimizeDeps: {
          include: [
            'react-dom/client',
            'axe-core',
            'd3-scale',
            'd3-shape',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
          ],
        },
        test: {
          ...comun,
          name: 'componentes',
          include: ['src/**/*.cmp.test.tsx'],
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
