// Proyectos de Playwright de 07 §3.2 (DP-08). Los resultados de `webkit-parcial` no bloquean (§7.3).
// La pila local y el usuario de prueba los levanta `pnpm test:e2e` (tools/pruebas/e2e.mjs, TA-219).
import { defineConfig, devices } from '@playwright/test';
import { ARCHIVO_RELOJ } from '../../tools/pruebas/e2e/reloj.ts';

const enCI = process.env['CI'] !== undefined && process.env['CI'] !== '';
const PUERTO = 3100;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // 05 §14.1 y 07 §7.2: un solo trabajador; un reintento solo en CI, con traza al reintentar.
  workers: 1,
  fullyParallel: false,
  retries: enCI ? 1 : 0,
  forbidOnly: enCI,
  reporter: enCI ? [['list'], ['json', { outputFile: 'test-results/informe.json' }]] : 'list',
  // 07 §7.1: el navegador usa America/El_Salvador, salvo el proyecto zona-distinta.
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'on-first-retry',
    timezoneId: 'America/El_Salvador',
    locale: 'es-SV',
  },
  // 05 §14.1 (FE-50): la E2E corre contra la compilación de producción, no contra `next dev`.
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${PUERTO}`,
    // Por puerto: sin sesión `/` redirige a /ingresar, y una URL que redirige no da «listo».
    port: PUERTO,
    // Nunca uno ajeno: tiene que ser este, con el reloj de prueba (CT-01, P7-10)
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      FINN_ENTORNO: 'pruebas',
      FINN_RELOJ_ARCHIVO: ARCHIVO_RELOJ,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
  projects: [
    // La sesión AAL2 (05 §14.1), por la pantalla real de FT-01. Es dependencia de los demás: `tamano.e2e.ts` la usa para medir.
    { name: 'configuracion', testMatch: '**/*.setup.ts', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'movil',
      dependencies: ['configuracion'],
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'escritorio',
      dependencies: ['configuracion'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    // 05 §14.1: solo `pantallas/` con fechas
    {
      name: 'zona-distinta',
      dependencies: ['configuracion'],
      testMatch: 'pantallas/**/*.e2e.ts',
      use: { ...devices['Desktop Chrome'], timezoneId: 'Asia/Tokyo' },
    },
    {
      name: 'webkit-parcial',
      dependencies: ['configuracion'],
      use: { ...devices['iPhone 13'] },
    },
  ],
});
