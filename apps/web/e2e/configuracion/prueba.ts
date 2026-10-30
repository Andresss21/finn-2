// El `test` de la E2E (TA-219; 07 §7.1): bloquea toda petición que no vaya al servidor de la app o a la pila local.
// Las pruebas de páginas importan `test` y `expect` de aquí, no de @playwright/test.
import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

const PILA = new URL(process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'http://127.0.0.1:54321').host;

export const test = base.extend<{ redBloqueada: undefined }>({
  redBloqueada: [
    async ({ page, baseURL }, usar) => {
      const permitidos = new Set([new URL(baseURL ?? 'http://localhost').host, PILA]);
      await page.route('**/*', (ruta) => {
        const { protocol, host } = new URL(ruta.request().url());
        const local = protocol === 'data:' || protocol === 'blob:' || permitidos.has(host);
        return local ? ruta.fallback() : ruta.abort('blockedbyclient');
      });
      await usar(undefined);
    },
    { auto: true },
  ],
});
