import { defineConfig, devices } from '@playwright/test';
export const ARCHIVO_RELOJ = '/tmp/claude-0/finn-reloj-e2e.json';
export default defineConfig({
  testDir: 'e2e', testMatch: '**/*.e2e.ts', workers: 1, retries: 0, reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:3107', locale: 'es-SV', timezoneId: 'America/El_Salvador', trace: 'off' },
  projects: [{ name: 'movil', use: { ...devices['Pixel 7'] } }],
  webServer: { command: 'npx next start -p 3107 -H 127.0.0.1', url: 'http://127.0.0.1:3107/api/eco', reuseExistingServer: false,
    env: { FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: ARCHIVO_RELOJ, NEXT_TELEMETRY_DISABLED: '1' } },
});
