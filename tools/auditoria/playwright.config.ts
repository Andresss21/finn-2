// Configuración de Playwright de la auditoría de diseño. No levanta nada: espera el servidor de `servir.mjs` en :3100.
// Se corre desde apps/web (ahí está @playwright/test): ver `correr.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const ENTORNO = join(tmpdir(), 'finn-auditoria-entorno.json');
if (existsSync(ENTORNO))
  Object.assign(process.env, JSON.parse(readFileSync(ENTORNO, 'utf8')) as Record<string, string>);
// Estas son solo del servidor (como en apps/web/playwright.config.ts): en el proceso de Playwright, el ejecutor `int`
// que siembra no debe verse en modo de pruebas ni leer el archivo del reloj.
for (const solo of ['FINN_ENTORNO', 'FINN_RELOJ_ARCHIVO', 'CRON_SECRET', 'RESPALDO_SECRET'])
  delete process.env[solo];

const telefono = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};
const comun = {
  baseURL: 'http://localhost:3100',
  timezoneId: 'America/El_Salvador',
  locale: 'es-SV',
  serviceWorkers: 'block' as const,
};
const ancho = (w: number, h: number) => ({
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
  colorScheme: 'light' as const,
});

export default {
  testDir: aqui,
  outputDir: join(aqui, '..', '..', 'test-results', 'auditoria'),
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  reporter: 'list',
  use: comun,
  projects: [
    {
      name: 'telefono-claro',
      testMatch: '**/*.cap.ts',
      use: { ...telefono, colorScheme: 'light' as const },
    },
    {
      name: 'telefono-oscuro',
      testMatch: '**/*.cap.ts',
      use: { ...telefono, colorScheme: 'dark' as const },
    },
    { name: 'computadora-claro', testMatch: '**/*.cap.ts', use: ancho(1440, 900) },
    // Responsive (punto 9): mismas pantallas, solo medidas de desborde y una captura
    { name: 'ancho-360', testMatch: '**/*.resp.ts', use: { ...telefono, viewport: { width: 360, height: 800 }, colorScheme: 'light' as const } },
    { name: 'ancho-768', testMatch: '**/*.resp.ts', use: ancho(768, 1024) },
    { name: 'ancho-1024', testMatch: '**/*.resp.ts', use: ancho(1024, 768) },
    // Movimiento (punto 8): video de los momentos clave, y la pasada con movimiento reducido
    {
      name: 'video',
      testMatch: '**/*.video.ts',
      use: { ...telefono, colorScheme: 'light' as const, video: { mode: 'on' as const, size: { width: 390, height: 844 } } },
    },
    {
      name: 'video-computadora',
      testMatch: '**/*.video.ts',
      use: { ...ancho(1440, 900), video: { mode: 'on' as const, size: { width: 1440, height: 900 } } },
    },
    // Referencias de diseño: mide los HTML de docs/diseno con el mismo medidor
    { name: 'referencias', testMatch: '**/*.ref.ts', use: {} },
  ],
};
