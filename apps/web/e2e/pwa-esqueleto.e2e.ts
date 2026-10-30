// PRU-E2E-PWA-101 (TA-200; 05 §1.2, §6.1; 04 §2.2.4): la compilación real de producción (`next build` y
// `next start`, que levanta el `webServer` de playwright.config.ts) separa lo público de lo autenticado.
import { expect, test } from '@playwright/test';
import config from '../next.config.ts';

test.describe('PRU-E2E-PWA', () => {
  test('PRU-E2E-PWA-101 [V5-22] /ingresar se sirve sin sesión, (finn)/ redirige a /ingresar?volver= y next.config.ts no cachea datos', async ({
    request,
  }) => {
    const publica = await request.get('/ingresar', { maxRedirects: 0 });
    // Sin redirección: la página de /ingresar la crea su tarea dueña (DT-23); hasta entonces responde 404 con el
    // layout raíz, que es lo que se comprueba aquí (no depende de la sesión, 05 §1.2).
    expect(publica.headers()['location']).toBeUndefined();
    expect(await publica.text()).toContain('<html lang="es"');

    const privada = await request.get('/', { maxRedirects: 0 });
    expect(privada.status()).toBe(307);
    expect(privada.headers()['location']).toBe('/ingresar?volver=%2F');

    const experimental = (config.experimental ?? {}) as Record<string, unknown>;
    expect(experimental['serverActions']).toEqual({ bodySizeLimit: '3mb' });
    expect(experimental['staleTimes']).toBeUndefined();
    expect(experimental['cacheComponents']).toBeUndefined();
    expect((config as Record<string, unknown>)['cacheComponents']).toBeUndefined();
  });
});
