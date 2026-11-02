// El token del webhook de punta a punta en el servidor (FT-03; 04 §8.1, §8.2, §8.8; OPT-01): la Server Action `rotarTokenWebhook`
// con la sesión AAL2 simulada, el `POST /api/sms` real y las consultas `ajustes()` y `bandeja()` sobre la base de prueba. Solo se
// reemplazan `next/headers`, `@supabase/ssr` (la sesión), `next/cache` y `after()`, que necesitan el contexto de una petición.
import { createHash } from 'node:crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SesionServidor } from '@finn/aplicacion/autenticacion';
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { bandeja } from '@finn/aplicacion/consultas/bandeja';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { consultar, crearBasePrueba } from '../../../../../../tools/pruebas/rh.ts';
import { rotarTokenWebhook } from '../../../servidor/acciones/ajustes.ts';
import { POST } from './route.ts';

const USUARIO = '00000000-0000-4000-8000-000000000999';
const URL_SMS = 'http://finn.test/api/sms';

const h = vi.hoisted((): { despues: (() => Promise<void>)[]; aal: string | null } => ({
  despues: [],
  aal: 'aal2',
}));
vi.mock('next/server', () => ({ after: (t: () => Promise<void>) => h.despues.push(t) }));
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => undefined }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: () =>
        Promise.resolve({
          data:
            h.aal === null
              ? null
              : { claims: { sub: '00000000-0000-4000-8000-000000000999', aal: h.aal } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: h.aal === null ? null : { id: '00000000-0000-4000-8000-000000000999' } },
          error: null,
        }),
    },
  }),
}));

const sesion: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' } as never),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};

describe('PRU-RH-BAND (FT-03: token del webhook)', () => {
  const base = crearBasePrueba();

  const filas = async (desde: string): Promise<Record<string, unknown>[]> =>
    (await consultar(base.urlAdmin, `SELECT row_to_json(f)::text FROM (${desde}) f`)).map(
      (t) => JSON.parse(t) as Record<string, unknown>,
    );
  const contarSms = async (): Promise<number> =>
    (await filas('SELECT id FROM finn.sms_recibidos')).length;
  const hashGuardado = async (): Promise<unknown> =>
    (await filas('SELECT hash_sha256 FROM finn.token_webhook'))[0]?.['hash_sha256'];
  const post = (cuerpo: unknown, token: string) =>
    POST(
      new Request(URL_SMS, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      }),
    );
  const rotar = async (): Promise<string> => {
    const r = await rotarTokenWebhook();
    if (!r.ok) throw new Error('la rotación no debió fallar');
    return (r.valor as { token: string }).token;
  };
  const deps = () => ({
    memoria: memoriaDeInstancia,
    sesion,
    usuarioPermitido: USUARIO,
  });

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url;
  });
  beforeEach(() => {
    h.despues.length = 0;
    h.aal = 'aal2';
    vi.stubEnv('FINN_USUARIO_ID', USUARIO);
    vi.stubEnv('FINN_ENTORNO', undefined);
    vi.stubEnv('FINN_RELOJ_ARCHIVO', undefined);
    vi.stubEnv('FINN_HOY_SIMULADO', undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('PRU-RH-BAND-102 [CA-03.1] OPT-01 muestra el token una sola vez y token_webhook guarda solo su SHA-256 de 64 hexadecimales', async () => {
    const token = await rotar();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const hash = await hashGuardado();
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(createHash('sha256').update(token, 'utf8').digest('hex'));
    // El token en claro no está en ninguna tabla técnica ni en lo que la consulta de Ajustes devuelve al abrir de nuevo
    const guardado = JSON.stringify(
      await filas(
        `SELECT (SELECT coalesce(json_agg(t), '[]') FROM finn.token_webhook t) AS token, (SELECT coalesce(json_agg(e), '[]') FROM finn.eventos_sistema e) AS eventos`,
      ),
    );
    expect(guardado).not.toContain(token);
    const dto = await ajustes(deps());
    expect(dto.webhook).toMatchObject({ configurado: true });
    expect(JSON.stringify(dto)).not.toContain(token);
  });

  it('PRU-RH-BAND-102 [CA-03.1] sin sesión AAL2 la acción responde NO_AUTORIZADO y no cambia el token', async () => {
    await rotar();
    const antes = await hashGuardado();
    for (const aal of [null, 'aal1']) {
      h.aal = aal;
      const r = await rotarTokenWebhook();
      expect(r).toMatchObject({ ok: false, error: { categoria: 'NO_AUTORIZADO' } });
    }
    expect(await hashGuardado()).toBe(antes);
  });

  it('PRU-RH-BAND-103 [CA-03.2] con un token rotado, el anterior responde 401 sin guardar nada y el nuevo responde 200', async () => {
    const anterior = await rotar();
    const nuevo = await rotar();
    expect(nuevo).not.toBe(anterior);
    const antes = await contarSms();
    const rechazado = await post({ texto: 'hola', remitente: 'BAC' }, anterior);
    expect(rechazado.status).toBe(401);
    expect(await contarSms()).toBe(antes);
    const aceptado = await post({ texto: 'hola', remitente: 'BAC' }, nuevo);
    expect(aceptado.status).toBe(200);
    expect(await contarSms()).toBe(antes + 1);
  });

  it('PRU-RH-BAND-104 [CA-03.3] con el token correcto, un texto que no coincide con ningún formato queda en la Bandeja como no reconocido, con su texto original', async () => {
    const token = await rotar();
    const texto = 'Mensaje de prueba "sin formato"\nsegunda línea';
    const r = await post({ texto, remitente: 'BAC' }, token);
    expect(r.status).toBe(200);
    for (const tarea of h.despues.splice(0)) await tarea();
    const dto = await bandeja(deps());
    const mio = dto.movimientos.filter((m) => m.sms.texto === texto);
    expect(mio).toHaveLength(1);
    expect(mio[0]).toMatchObject({ estado: 'no_reconocido', sms: { remitente: 'BAC' } });
  });
});
