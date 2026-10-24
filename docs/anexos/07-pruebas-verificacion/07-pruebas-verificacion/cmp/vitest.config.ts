// Prototipo de CT-04 (V7-15): nivel CMP con el modo navegador de Vitest y el Chromium de Playwright, sin servidor ni base.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { include: ['src/**/*.cmp.test.tsx'], browser: { enabled: true, provider: 'playwright', headless: true, instances: [{ browser: 'chromium' }] } },
});
