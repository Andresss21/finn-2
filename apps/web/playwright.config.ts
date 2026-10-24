// Proyectos de Playwright de 07 §3.2 (DP-08). Los resultados de `webkit-parcial` no bloquean (§7.3).
import { defineConfig, devices } from '@playwright/test';

const enCI = process.env['CI'] !== undefined && process.env['CI'] !== '';

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
  use: { trace: 'on-first-retry', timezoneId: 'America/El_Salvador', locale: 'es-SV' },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'zona-distinta', use: { ...devices['Desktop Chrome'], timezoneId: 'Asia/Tokyo' } },
    { name: 'webkit-parcial', use: { ...devices['iPhone 13'] } },
  ],
});
