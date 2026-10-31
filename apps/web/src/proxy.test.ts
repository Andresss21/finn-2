// `proxy.ts` con Supabase simulado: lo que la E2E no ve (cabecera reemplazada, POST, cookies en la redirección, matcher).
// El cliente real corre en PRU-E2E-ACCESO-001 y 101.
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config, proxy } from './proxy.ts';

const FINN = '0b6f2c1e-5a4d-4c3b-9e8f-7a6b5c4d3e2f';

const simulado = vi.hoisted(() => ({
  aal: null as string | null,
  fijar: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _clave: string,
    o: { cookies: { setAll(a: typeof simulado.fijar, c: Record<string, string>): void } },
  ) => ({
    auth: {
      getClaims() {
        if (simulado.fijar.length > 0)
          o.cookies.setAll(simulado.fijar, { 'cache-control': 'private, no-store' });
        return Promise.resolve({
          data: simulado.aal === null ? null : { claims: { sub: FINN, aal: simulado.aal } },
          error: null,
        });
      },
      getUser: () => Promise.reject(new Error('el proxy no llama a getUser')),
    },
  }),
}));

const pedir = (ruta: string, init?: { method?: string; headers?: Record<string, string> }) =>
  proxy(new NextRequest(`http://localhost:3100${ruta}`, init));
const CABECERA_RUTA = 'x-middleware-request-x-finn-ruta';

describe('PRU-SEG-ACCESO', () => {
  beforeEach(() => {
    process.env['FINN_USUARIO_ID'] = FINN;
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'http://127.0.0.1:54321';
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] = 'publica';
    simulado.aal = null;
    simulado.fijar = [];
  });

  it('PRU-SEG-ACCESO-104 CP-14, CH-50: redirige solo las navegaciones sin AAL2, reemplaza x-finn-ruta, conserva las cookies y deja fuera lo que excluye el matcher', async () => {
    const sinSesion = await pedir('/presupuesto?periodo=2026-09-21');
    expect(sinSesion.status).toBe(307);
    expect(sinSesion.headers.get('location')).toBe(
      'http://localhost:3100/ingresar?volver=%2Fpresupuesto%3Fperiodo%3D2026-09-21',
    );

    simulado.aal = 'aal1';
    expect((await pedir('/cuentas')).headers.get('location')).toBe(
      'http://localhost:3100/ingresar/verificar?volver=%2Fcuentas',
    );

    // Las rutas de `ingresar` nunca redirigen (CP-14), pero sí llevan la cabecera y refrescan.
    simulado.aal = null;
    for (const ruta of ['/ingresar', '/ingresar/verificar', '/ingresar/inscribir?volver=%2F']) {
      const r = await pedir(ruta);
      expect(r.headers.get('location'), ruta).toBeNull();
      expect(r.headers.get(CABECERA_RUTA), ruta).toBe(ruta);
    }
    // `/ingresarse` no es una ruta de `ingresar`.
    expect((await pedir('/ingresarse')).status).toBe(307);

    // Una Server Action (POST) llega a su `exigirSesionAal2()` y responde NO_AUTORIZADO (05 §7.5).
    expect((await pedir('/cuentas', { method: 'POST' })).headers.get('location')).toBeNull();

    // La cabecera entrante se ignora.
    simulado.aal = 'aal2';
    const conAal2 = await pedir('/cuentas?a=1', { headers: { 'x-finn-ruta': '//evil.example' } });
    expect(conAal2.headers.get('location')).toBeNull();
    expect(conAal2.headers.get(CABECERA_RUTA)).toBe('/cuentas?a=1');

    // Las cookies que fija Supabase llegan a la página y al navegador; también en una redirección.
    simulado.fijar = [{ name: 'sb-127-auth-token', value: 'nuevo', options: { path: '/' } }];
    const refrescada = await pedir('/cuentas');
    expect(refrescada.cookies.get('sb-127-auth-token')?.value).toBe('nuevo');
    expect(refrescada.headers.get('cache-control')).toBe('private, no-store');
    expect(refrescada.headers.get('x-middleware-request-cookie')).toContain(
      'sb-127-auth-token=nuevo',
    );
    expect(refrescada.headers.get(CABECERA_RUTA)).toBe('/cuentas');
    simulado.aal = null;
    simulado.fijar = [{ name: 'sb-127-auth-token', value: '', options: { maxAge: 0 } }];
    const cerrada = await pedir('/cuentas');
    expect(cerrada.status).toBe(307);
    expect(cerrada.headers.get('set-cookie')).toContain('sb-127-auth-token=;');

    const matcher = new RegExp(`^${config.matcher[0] ?? ''}$`);
    for (const ruta of [
      '/',
      '/cuentas',
      '/ingresar',
      '/apuntes',
      '/sin-conexion-otra',
      '/icon.svg/x',
      '/marcas',
    ])
      expect(matcher.test(ruta), ruta).toBe(true);
    for (const ruta of [
      '/api/sms',
      '/api/notificaciones/accion',
      '/api/pruebas/reloj',
      '/_next/static/x.js',
      '/_next/image',
      '/serwist/sw.js',
      '/sin-conexion',
      '/manifest.webmanifest',
      '/marca/icono-192.png',
      '/marca/apple-touch-icon.png',
      '/icon.svg',
      '/favicon.ico',
    ])
      expect(matcher.test(ruta), ruta).toBe(false);
  });
});
