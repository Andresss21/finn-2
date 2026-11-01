// PRU-E2E-PWA-101 (TA-200; 05 §1.2, §6.1; 04 §2.2.4): la compilación real de producción (`next build` y
// `next start`, que levanta el `webServer` de playwright.config.ts) separa lo público de lo autenticado.
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { prerenderizadasDeFinn } from '../../../tools/pruebas/rendimiento/clasificar.ts';
import config from '../next.config.ts';

const leer = (f: string): unknown => JSON.parse(readFileSync(f, 'utf8'));

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

  // PRU-E2E-PWA-104 (CH-66): se lee la compilación que levantó el `webServer`; el manifiesto trae `/manifest.webmanifest`,
  // que sí es estático, para que un cambio de formato de Next no deje la prueba en verde sin mirar nada. Que el `after()`
  // no corra al compilar lo prueba otra barrera, `tools/pruebas/e2e/compilar.mjs`: ese caso no se ve en este manifiesto.
  test('PRU-E2E-PWA-104 ninguna ruta de (finn), con slots e interceptaciones, queda prerenderizada en la compilación', () => {
    const rutas = leer('.next/app-path-routes-manifest.json') as Record<string, string>;
    const prerender = leer('.next/prerender-manifest.json') as Parameters<
      typeof prerenderizadasDeFinn
    >[1];
    expect(Object.keys(rutas).some((c) => c.startsWith('/(finn)/@superpuesto/'))).toBe(true);
    expect(Object.keys(prerender.routes)).toContain('/manifest.webmanifest');
    expect(prerenderizadasDeFinn(rutas, prerender)).toEqual([]);
  });

  // PRU-E2E-PWA-102 (TA-203; 05 §8.2, §10.11): el manifiesto responde sin sesión con los campos de 05 §8.2 y sus
  // íconos existen; el maskable mide 512 × 512 (ancho y alto, bytes 16 a 23 del PNG).
  test('PRU-E2E-PWA-102 /manifest.webmanifest tiene los campos de 05 §8.2 y sus íconos responden 200', async ({
    request,
  }) => {
    const respuesta = await request.get('/manifest.webmanifest', { maxRedirects: 0 });
    expect(respuesta.status()).toBe(200);
    const m = (await respuesta.json()) as Record<string, unknown> & {
      icons: { src: string; sizes: string; purpose: string }[];
      shortcuts: { name: string; url: string }[];
    };
    expect(m).toMatchObject({
      id: '/',
      start_url: '/',
      scope: '/',
      name: 'Finn',
      short_name: 'Finn',
      description: 'Tu presupuesto base cero.',
      lang: 'es-SV',
      dir: 'ltr',
      display: 'standalone',
      background_color: '#101418',
      theme_color: '#101418',
    });
    expect(m['orientation']).toBeUndefined();
    expect(m.shortcuts.map((s) => [s.name, s.url])).toEqual([
      ['Registrar gasto', '/registrar/gasto'],
      ['Bandeja', '/bandeja'],
    ]);
    expect(m.icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '512x512 maskable',
    ]);
    for (const icono of m.icons) {
      const png = await request.get(icono.src, { maxRedirects: 0 });
      expect(png.status(), icono.src).toBe(200);
      const cuerpo = await png.body();
      const [ancho, alto] = icono.sizes.split('x').map(Number);
      if (icono.purpose === 'maskable') {
        expect([cuerpo.readUInt32BE(16), cuerpo.readUInt32BE(20)]).toEqual([512, 512]);
      }
      expect([cuerpo.readUInt32BE(16), cuerpo.readUInt32BE(20)]).toEqual([ancho, alto]);
    }
  });
});
