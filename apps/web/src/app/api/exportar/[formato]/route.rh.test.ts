// `GET /api/exportar/[formato]` por HTTP (TA-217; 04 §1.2, §3.10 OPT-08, §12.3), contra la base de prueba como `finn_app`.
// Solo se reemplazan Supabase (la sesión) y las cookies. Los formatos en sí son de TA-168; aquí, la autorización y la descarga.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  crearBasePrueba,
  escribirHechosDePrueba,
  HOY,
} from '../../../../../../../tools/pruebas/rh.ts';
import { GET } from './route.ts';

const USUARIO = '00000000-0000-4000-8000-000000000999';
const AHORA_MS = 1_900_000_000_000;

interface Simulado {
  aal: string | null;
  usuarioVigente: boolean;
  usuarioId: string;
}
const h = vi.hoisted((): Simulado => ({
  aal: 'aal2',
  usuarioVigente: true,
  usuarioId: '00000000-0000-4000-8000-000000000999',
}));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => undefined }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: () =>
        Promise.resolve({
          data: h.aal === null ? null : { claims: { sub: h.usuarioId, aal: h.aal } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: h.usuarioVigente ? { id: h.usuarioId } : null },
          error: null,
        }),
    },
  }),
}));

describe('PRU-RH-AJUS', () => {
  const base = crearBasePrueba();
  const pedir = (formato: string) =>
    GET(new Request(`http://finn.test/api/exportar/${formato}`), {
      params: Promise.resolve({ formato }),
    });

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url;
    await escribirHechosDePrueba(base);
  });
  beforeEach(() => {
    vi.stubEnv('FINN_USUARIO_ID', USUARIO);
    vi.stubEnv('FINN_ENTORNO', 'pruebas');
    vi.stubEnv('VERCEL_ENV', undefined);
    const archivo = join(mkdtempSync(join(tmpdir(), 'finn-rh-')), 'reloj.json');
    writeFileSync(
      archivo,
      JSON.stringify({ instante: `${HOY}T18:00:00.000Z`, fijadoEn: AHORA_MS }),
    );
    vi.stubEnv('FINN_RELOJ_ARCHIVO', archivo);
    vi.spyOn(Date, 'now').mockReturnValue(AHORA_MS);
    h.aal = 'aal2';
    h.usuarioVigente = true;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('PRU-RH-AJUS-101 RH-exportar: sin sesión, con AAL1, con la sesión revocada o con otro usuario responde 401 y sin datos, también con un formato inexistente', async () => {
    const casos: readonly (() => void)[] = [
      () => {
        h.aal = null;
      },
      () => {
        h.aal = 'aal1';
      },
      () => {
        h.usuarioVigente = false;
      },
      () => {
        vi.stubEnv('FINN_USUARIO_ID', '00000000-0000-4000-8000-000000000998');
      },
    ];
    for (const preparar of casos) {
      h.aal = 'aal2';
      h.usuarioVigente = true;
      vi.stubEnv('FINN_USUARIO_ID', USUARIO);
      preparar();
      for (const formato of ['json', 'csv', 'xml']) {
        const r = await pedir(formato);
        expect(r.status).toBe(401);
        expect(await r.text()).toBe('');
      }
    }
  });

  it('PRU-RH-AJUS-101 RH-exportar: con AAL2 descarga JSON y CSV sin caché ni registro en consola; un formato inexistente es 404', async () => {
    const consola = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m),
    );
    const json = await pedir('json');
    expect(json.status).toBe(200);
    expect(json.headers.get('content-type')).toMatch(/^application\/json/);
    expect(json.headers.get('content-disposition')).toBe(
      `attachment; filename="finn-hechos-${HOY}.json"`,
    );
    expect(json.headers.get('cache-control')).toBe('private, no-store');
    expect(json.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await json.json()).toMatchObject({ aplicacion: 'finn', versionFormato: 1, hoy: HOY });

    const csv = await pedir('csv');
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-disposition')).toBe(
      `attachment; filename="finn-transacciones-${HOY}.csv"`,
    );
    expect(csv.headers.get('cache-control')).toBe('private, no-store');

    expect((await pedir('xml')).status).toBe(404);
    for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  });
});
