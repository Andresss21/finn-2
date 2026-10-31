// PRU-SEG-ACCESO-002 (07 §19.1, DP-22; 05 §1.3, §9.1; CH-56): recorre el árbol real de `app/(finn)` y pide cada ruta sin sesión,
// con AAL1 y con AAL2, sin seguir redirecciones. Una ruta nueva entra sola. `(finn)/pruebas/*` no exige sesión en la página, solo
// `soloEnPruebas()`: se comprueba aparte, en un arranque como el de Vercel (VERCEL_ENV=preview), que con AAL2 da 404.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServerClient } from '@supabase/ssr';
import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { ingresar } from '../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { estados } from '../../src/textos/index.ts';

const WEB = fileURLToPath(new URL('../../', import.meta.url));
const NEXT = createRequire(import.meta.url).resolve('next/dist/bin/next');
const PUERTO_PREVIEW = 3102; // 3100 el webServer, 3101 PRU-SEG-RELOJ-001; un solo trabajador y bajo candado (DT-22)
const ID = '00000000-0000-4000-8000-000000000001';

const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: lo fija pnpm test:e2e`);
  return v;
};

interface Ruta {
  readonly url: string;
  readonly conParametro: boolean;
}

/** Los `page.tsx` de `(finn)`: sin grupos ni `@slots`; las intercepciones y el comodín de un slot no son URL propias. */
function rutasDeFinn(): Ruta[] {
  const dir = fileURLToPath(new URL('../../src/app/(finn)/', import.meta.url));
  const rutas = new Map<string, Ruta>();
  for (const archivo of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    const partes = archivo.replaceAll('\\', '/').split('/');
    if (!/^page\.tsx?$/.test(partes.pop() ?? '')) continue;
    if (partes.some((s) => /^\(\.+\)/.test(s))) continue;
    const enSlot = partes.some((s) => s.startsWith('@'));
    if (enSlot && partes.some((s) => s.startsWith('[...') || s.startsWith('[[...'))) continue;
    const tramos = partes.filter((s) => !s.startsWith('@') && !/^\(.*\)$/.test(s));
    const url = `/${tramos.map((s) => (s.startsWith('[') ? ID : s)).join('/')}`;
    rutas.set(url, { url, conParametro: tramos.some((s) => s.startsWith('[')) });
  }
  return [...rutas.values()].sort((a, b) => a.url.localeCompare(b.url));
}

type Estado = 'sin sesión' | 'AAL1' | 'AAL2';

/** Null si la ruta se comporta como una protegida en ese estado; si no, qué pasó. */
async function falla(pedir: APIRequestContext, r: Ruta, estado: Estado): Promise<string | null> {
  const respuesta = await pedir.get(r.url, { maxRedirects: 0 });
  const codigo = respuesta.status();
  const destino = respuesta.headers()['location'] ?? '';
  const describir = `${estado} ${r.url}: ${codigo} ${destino}`;
  if (estado === 'AAL2') {
    const redirige = codigo >= 300 && codigo < 400;
    // Un id inventado puede dar 404; una ruta sin parámetros se muestra o redirige dentro de la app
    const bien = r.conParametro ? codigo < 500 : codigo === 200 || redirige;
    return bien && !destino.includes('/ingresar') ? null : describir;
  }
  const paso = estado === 'AAL1' ? '/ingresar/verificar' : '/ingresar';
  const esperado = `${paso}?volver=${encodeURIComponent(r.url)}`;
  const llega = new URL(destino || '/', 'http://x');
  return codigo === 307 && llega.pathname + llega.search === esperado ? null : describir;
}

/** Sesión AAL1 real: contraseña sin el segundo factor. */
async function entrarAal1(context: BrowserContext, baseURL: string): Promise<void> {
  const frasco = new Map<string, string>();
  const { auth } = createServerClient(
    variable('NEXT_PUBLIC_SUPABASE_URL'),
    variable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => [...frasco].map(([name, value]) => ({ name, value })),
        setAll(a) {
          for (const { name, value } of a)
            if (value === '') frasco.delete(name);
            else frasco.set(name, value);
        },
      },
    },
  );
  const paso = await ingresar(auth, variable('FINN_USUARIO_ID'), {
    email: variable('E2E_EMAIL'),
    contrasena: variable('E2E_CLAVE'),
  });
  if (!paso.ok) throw new Error('el usuario de prueba no pudo ingresar');
  await context.clearCookies();
  await context.addCookies([...frasco].map(([name, value]) => ({ name, value, url: baseURL })));
}

test.describe('PRU-SEG-ACCESO', () => {
  test.describe.configure({ timeout: 120_000 }); // Una ruta por estado y un arranque de `next start`

  test('PRU-SEG-ACCESO-002 cada ruta real de (finn) redirige sin sesión, pide el factor con AAL1 y se muestra con AAL2', async ({
    context,
    baseURL,
  }) => {
    const rutas = rutasDeFinn();
    expect(rutas.map((r) => r.url)).toEqual(expect.arrayContaining(['/', '/pruebas/origen']));
    const url = baseURL ?? '';
    const fallas: (string | null)[] = [];

    await context.clearCookies();
    for (const r of rutas) fallas.push(await falla(context.request, r, 'sin sesión'));

    // Control: la misma comprobación sobre una ruta fuera de la barrera tiene que fallar
    const fuera = { url: '/manifest.webmanifest', conParametro: false };
    expect(await falla(context.request, fuera, 'sin sesión')).toContain(': 200');

    await entrarAal1(context, url);
    for (const r of rutas) fallas.push(await falla(context.request, r, 'AAL1'));
    expect(await falla(context.request, fuera, 'AAL1')).toContain(': 200');

    await entrarAal2(context, url);
    for (const r of rutas) fallas.push(await falla(context.request, r, 'AAL2'));

    expect(fallas.filter((f) => f !== null)).toEqual([]);
  });

  test('PRU-SEG-ACCESO-002 fuera de pruebas, (finn)/pruebas/* da 404 también con AAL2', async ({
    context,
    baseURL,
  }) => {
    const proceso = spawn(process.execPath, [NEXT, 'start', '-p', String(PUERTO_PREVIEW)], {
      cwd: WEB,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        VERCEL_ENV: 'preview',
        FINN_ENTORNO: undefined,
        FINN_RELOJ_ARCHIVO: undefined,
        FINN_HOY_SIMULADO: undefined,
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const cerrado = new Promise((resolver) => proceso.once('close', resolver));
    try {
      await new Promise<void>((resolver, rechazar) => {
        proceso.stdout.on('data', (d: Buffer) => {
          if (d.toString().includes('Ready')) resolver();
        });
        proceso.once('close', () => {
          rechazar(new Error('next start salió antes de estar listo'));
        });
      });
      await entrarAal2(context, baseURL ?? '');
      const dePruebas = rutasDeFinn().filter((r) => r.url.startsWith('/pruebas/'));
      expect(dePruebas.length).toBeGreaterThan(0);
      for (const r of dePruebas) {
        const respuesta = await context.request.get(`http://localhost:${PUERTO_PREVIEW}${r.url}`, {
          maxRedirects: 0,
        });
        // Con el `loading.tsx` de `(finn)` la respuesta sale en streaming y `notFound()` llega con 200 y `noindex`
        // (CH-59): lo que se exige es la pantalla «Esto ya no existe.» y que no salga nada de la página de prueba.
        expect([200, 404], r.url).toContain(respuesta.status());
        const cuerpo = await respuesta.text();
        expect(cuerpo, r.url).toContain(estados.noExisteTitulo);
        expect(cuerpo, r.url).toContain('noindex');
      }
    } finally {
      proceso.kill();
      await cerrado;
    }
  });
});
