// Sesión contra la pila local (TA-214; 04 §12.2, §12.4; 05 §7.5). /ingresar aún no tiene página (DT-23): se comprueba la
// URL a la que se llega. La sesión real se arma con las funciones de 04 §12.2 y un cliente sobre un frasco de cookies.
import { createServerClient } from '@supabase/ssr';
import { expect, test } from '../configuracion/semilla.ts';
import { codigoTotp } from '../ayudas/totp.ts';
import { TOTP } from 'otpauth';
import {
  completarInscripcion,
  estadoAcceso,
  iniciarInscripcion,
  ingresar,
  salir,
  verificarFactor,
} from '../../../../packages/aplicacion/src/autenticacion/supabase.ts';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: lo fija pnpm test:e2e`);
  return v;
};
const URL_AUTH = (): string => variable('NEXT_PUBLIC_SUPABASE_URL');

/** Como la llama @supabase/ssr: `sb-<primer tramo del host>-auth-token`. */
const nombreCookie = (): string => `sb-${new URL(URL_AUTH()).hostname.split('.')[0]}-auth-token`;

const base64url = (texto: string): string => Buffer.from(texto).toString('base64url');

const PROTEGIDA = '/protegida?periodo=2026-09-21';
const AL_INGRESAR = '/ingresar?volver=%2Fprotegida%3Fperiodo%3D2026-09-21';
const destinoDe = (url: string): string => {
  const { pathname, search } = new URL(url);
  return pathname + search;
};

function frascoDeSesion() {
  const frasco = new Map<string, string>();
  const cliente = createServerClient(URL_AUTH(), variable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), {
    cookies: {
      getAll: () => [...frasco].map(([name, value]) => ({ name, value })),
      setAll(a) {
        for (const { name, value } of a)
          if (value === '') frasco.delete(name);
          else frasco.set(name, value);
      },
    },
  });
  return { frasco, auth: cliente.auth };
}

test.describe('PRU-E2E-ACCESO', () => {
  test('PRU-E2E-ACCESO-001 [V5-16] sesión vencida en una consulta redirige con volver', async ({
    page,
    context,
    baseURL,
  }) => {
    // Sin cookie
    await page.goto(PROTEGIDA);
    expect(destinoDe(page.url())).toBe(AL_INGRESAR);

    // Cookie ilegible
    const url = baseURL ?? '';
    await context.addCookies([{ name: nombreCookie(), value: 'base64-no-es-json', url }]);
    await page.goto(PROTEGIDA);
    expect(destinoDe(page.url())).toBe(AL_INGRESAR);

    // Sesión vencida: JWT vencido y refresh token que Auth rechaza; la cookie se limpia en la redirección.
    const carga = base64url(
      JSON.stringify({ sub: variable('FINN_USUARIO_ID'), aal: 'aal2', exp: 1 }),
    );
    const vencida = {
      access_token: `${base64url('{"alg":"ES256","typ":"JWT"}')}.${carga}.firma`,
      refresh_token: 'rechazado',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: { id: variable('FINN_USUARIO_ID') },
    };
    await context.addCookies([
      { name: nombreCookie(), value: `base64-${base64url(JSON.stringify(vencida))}`, url },
    ]);
    await page.goto(PROTEGIDA);
    expect(destinoDe(page.url())).toBe(AL_INGRESAR);
    const cookies = await context.cookies();
    expect(cookies.filter((c) => c.name.startsWith(nombreCookie()))).toEqual([]);
  });

  test('PRU-E2E-ACCESO-101 AUTH-funciones: las funciones de 04 §12.2 con Auth real: AAL1 pide el factor, AAL2 entra, respaldo se inscribe y salir cierra', async ({
    page,
    context,
    baseURL,
    request,
  }) => {
    const finn = variable('FINN_USUARIO_ID');
    const { frasco, auth } = frascoDeSesion();
    const pasarCookies = async (): Promise<void> => {
      await context.clearCookies();
      await context.addCookies(
        [...frasco].map(([name, value]) => ({ name, value, url: baseURL ?? '' })),
      );
    };
    const email = variable('E2E_EMAIL');

    expect(
      await ingresar(auth, finn, { email, contrasena: `${variable('E2E_CLAVE')}x` }),
    ).toMatchObject({ ok: false, error: { codigo: 'credenciales_invalidas' } });
    expect(await ingresar(auth, finn, { email, contrasena: variable('E2E_CLAVE') })).toMatchObject({
      ok: true,
      valor: { siguiente: 'verificar' },
    });
    expect(await estadoAcceso(auth, finn)).toMatchObject({
      sesion: 'aal1',
      usuarioPermitido: true,
      factoresVerificados: [{ id: expect.any(String) }],
    });

    await pasarCookies();
    await page.goto(PROTEGIDA);
    expect(destinoDe(page.url())).toBe(
      '/ingresar/verificar?volver=%2Fprotegida%3Fperiodo%3D2026-09-21',
    );
    // Una consulta de Next (RSC) no agrega su parámetro interno a `volver`.
    const rsc = await request.get('/protegida?a=1&_rsc=abc', {
      headers: { rsc: '1' },
      maxRedirects: 0,
    });
    expect(rsc.headers()['location']).toContain('volver=%2Fprotegida%3Fa%3D1');
    expect(rsc.headers()['location']).not.toContain('_rsc');

    expect(await iniciarInscripcion(auth, finn, {})).toMatchObject({
      ok: false,
      error: { codigo: 'inscripcion_no_permitida' },
    });
    expect(await verificarFactor(auth, finn, { codigo: codigoTotp() })).toMatchObject({ ok: true });
    expect(await estadoAcceso(auth, finn)).toMatchObject({ sesion: 'aal2' });

    await pasarCookies();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inicio vacío');

    // Factor de respaldo con el secreto que entrega `enroll`; se quita para no dejar rastro en el usuario.
    const inicio = await iniciarInscripcion(auth, finn, {});
    if (!inicio.ok) throw new Error(inicio.error.codigo);
    expect(inicio.valor.qrSvg).toContain('<svg');
    const codigo = new TOTP({ secret: inicio.valor.secreto }).generate();
    expect(
      await completarInscripcion(auth, finn, { factorId: inicio.valor.factorId, codigo }),
    ).toMatchObject({ ok: true });
    await auth.mfa.unenroll({ factorId: inicio.valor.factorId });

    expect(await salir(auth)).toMatchObject({ ok: true });
    expect(await estadoAcceso(auth, finn)).toMatchObject({ sesion: 'ninguna' });
    await pasarCookies();
    await page.goto('/');
    expect(destinoDe(page.url())).toBe('/ingresar?volver=%2F');
  });
});
