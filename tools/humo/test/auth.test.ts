// PRU-SEG-ACCESO-102 (TA-253; 04 §12.6 [CH-42], §17.2 H-10; 07 §5.3): `tools/recuperacion/borrar-factores.mjs` y el
// paso H-10 de humo.sh contra la pila local de Supabase (`supabase start -x …`, db, auth y kong, con la
// configuración de supabase/config.toml: TOTP habilitado y registro cerrado, 04 §12.1). Las claves salen de
// `supabase status`. Solo local: si la pila no está levantada (en el runner de CI no se levanta), la prueba se omite.
import { spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/');
const API = 'http://127.0.0.1:54321';
const pila =
  spawnSync('docker', ['ps', '-q', '--filter', 'name=^supabase_auth_finn$'], {
    encoding: 'utf8',
  }).stdout.trim() !== '';

function claves(): Record<string, string> {
  if (!pila) return {};
  const cli =
    /^SUPABASE_CLI=(\S+)/m.exec(readFileSync(`${raiz}infra/versiones.env`, 'utf8'))?.[1] ?? '';
  const r = spawnSync(`npx -y supabase@${cli} status -o env`, {
    cwd: raiz,
    shell: true,
    encoding: 'utf8',
  });
  return Object.fromEntries(
    r.stdout.split('\n').flatMap((l) => {
      const m = /^([A-Z_]+)="?(.*?)"?\s*$/.exec(l);
      return m?.[1] && m[2] !== undefined ? [[m[1], m[2]]] : [];
    }),
  );
}
const { SERVICE_ROLE_KEY: servicio = '', ANON_KEY: publica = '' } = claves();
const creados: string[] = [];

// `ms`: la hora de la cabecera Date de GoTrue (el reloj del servicio, que es el que valida el TOTP)
type R = { s: number; ms: number; b: Record<string, unknown> & { error_code?: string } };
async function pedir(
  m: string,
  ruta: string,
  cuerpo?: unknown,
  token = servicio,
  apikey = servicio,
): Promise<R> {
  const r = await fetch(`${API}/auth/v1${ruta}`, {
    method: m,
    headers: { apikey, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
  const t = await r.text();
  return {
    s: r.status,
    ms: Date.parse(r.headers.get('date') ?? ''),
    b: (t ? JSON.parse(t) : {}) as R['b'],
  };
}
const ingresar = (email: string, password: string) =>
  pedir('POST', '/token?grant_type=password', { email, password }, publica, publica);
const renovar = (t: unknown) =>
  pedir('POST', '/token?grant_type=refresh_token', { refresh_token: t }, publica, publica);
// El código TOTP (RFC 6238) para la hora que informó GoTrue: la prueba no lee el reloj de pared
function totp(secreto: string, ms: number): string {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = (secreto.replace(/=+$/, '').match(/./g) ?? [])
    .map((c) => a.indexOf(c).toString(2).padStart(5, '0'))
    .join('');
  const clave = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const paso = Buffer.alloc(8);
  paso.writeBigUInt64BE(BigInt(Math.floor(ms / 30_000)));
  const h = createHmac('sha1', clave).update(paso).digest();
  return String((h.readUInt32BE((h[19] ?? 0) & 15) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const usuariosAuth = (): string =>
  spawnSync(
    'docker',
    [
      'exec',
      'supabase_db_finn',
      'psql',
      '-U',
      'postgres',
      '-At',
      '-c',
      'SELECT count(*) FROM auth.users',
    ],
    {
      encoding: 'utf8',
    },
  ).stdout.trim();

function borrarFactores(env: Record<string, string>) {
  return spawnSync(process.execPath, ['tools/recuperacion/borrar-factores.mjs'], {
    cwd: raiz,
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_URL: API, SUPABASE_SERVICE_ROLE: servicio, ...env },
  });
}

afterAll(async () => {
  for (const id of creados) await pedir('DELETE', `/admin/users/${id}`);
});

describe.skipIf(!pila)('PRU-SEG-ACCESO', () => {
  it('PRU-SEG-ACCESO-102 [H-10] BE-56 HUMO-iad1-auth: borrar-factores.mjs contra la pila local de Supabase: a un usuario con un TOTP verificado y dos sesiones (AAL1 y AAL2) le borra los factores, fija la contraseña nueva de FINN_CLAVE_NUEVA y así cierra sus sesiones (los dos refresh token fallan, la contraseña vieja ya no entra y la nueva sí), deja 0 factores y no escribe la clave de servicio ni la contraseña; controles: sin FINN_CLAVE_NUEVA sale con 2 y con un usuario inexistente con 1, sin la clave; y H-10 de humo.sh pasa contra la pila (JWKS asimétrico, recuperación, registro cerrado) y borra su usuario de prueba', async () => {
    expect(servicio.length, 'supabase status').toBeGreaterThan(20);
    const email = `pru-102-${randomBytes(6).toString('hex')}@example.com`;
    const [vieja, nueva] = [
      'v'.repeat(24) + randomBytes(4).toString('hex'),
      'n'.repeat(24) + randomBytes(4).toString('hex'),
    ];
    const u = await pedir('POST', '/admin/users', { email, password: vieja, email_confirm: true });
    expect(u.s).toBe(200);
    const id = String(u.b['id']);
    creados.push(id);
    const s1 = (await ingresar(email, vieja)).b;
    const f = (
      await pedir('POST', '/factors', { factor_type: 'totp' }, String(s1['access_token']), publica)
    ).b as {
      id: string;
      totp: { secret: string };
    };
    const ch = await pedir(
      'POST',
      `/factors/${f.id}/challenge`,
      {},
      String(s1['access_token']),
      publica,
    );
    const s2 = await pedir(
      'POST',
      `/factors/${f.id}/verify`,
      { challenge_id: ch.b['id'], code: totp(f.totp.secret, ch.ms) },
      String(s1['access_token']),
      publica,
    );
    expect(s2.s).toBe(200);

    const r = borrarFactores({ FINN_USUARIO_ID: id, FINN_CLAVE_NUEVA: nueva });
    const salida = `${r.stdout}\n${r.stderr}`;
    expect(r.status, salida).toBe(0);
    expect(r.stdout).toContain(`factor borrado ${f.id} (totp, verified)`);
    expect(r.stdout).toContain('factores restantes: 0');
    for (const secreto of [servicio, nueva, vieja]) expect(salida.includes(secreto)).toBe(false);

    expect((await pedir('GET', `/admin/users/${id}/factors`)).b).toEqual([]);
    expect((await renovar(s1['refresh_token'])).b.error_code).toBe('refresh_token_not_found');
    expect((await renovar(s2.b['refresh_token'])).b.error_code).toBe('refresh_token_not_found');
    expect((await ingresar(email, vieja)).s).toBe(400);
    expect((await ingresar(email, nueva)).s).toBe(200);

    // Controles: sin la contraseña nueva no toca nada; un usuario que no existe falla sin escribir la clave
    const sin = borrarFactores({ FINN_USUARIO_ID: id, FINN_CLAVE_NUEVA: '' });
    expect(sin.status).toBe(2);
    expect(sin.stderr).toContain('FINN_CLAVE_NUEVA');
    const otro = borrarFactores({
      FINN_USUARIO_ID: '00000000-0000-4000-8000-000000000253',
      FINN_CLAVE_NUEVA: nueva,
    });
    expect(otro.status).toBe(1);
    expect(otro.stderr).toMatch(/error en listFactors: HTTP 404/);
    for (const x of [sin, otro]) expect(`${x.stdout}${x.stderr}`.includes(servicio)).toBe(false);

    // H-10 de humo.sh contra la pila: crea, recupera y borra su propio usuario de prueba
    const antes = usuariosAuth();
    const h = spawnSync('bash', ['tools/humo/humo.sh'], {
      cwd: raiz,
      encoding: 'utf8',
      env: {
        ...process.env,
        HUMO_PASOS: 'H-10',
        HUMO_ADMIN_URL: 'postgresql://postgres@127.0.0.1:1/postgres',
        SUPABASE_URL: API,
        SUPABASE_SERVICE_ROLE: servicio,
        HUMO_CLAVE_PUBLICA: publica,
      },
    });
    expect(`${h.stdout}${h.stderr}`.includes(servicio)).toBe(false);
    expect(h.stderr).toBe('');
    const linea = JSON.parse(h.stdout.trim()) as {
      paso: string;
      resultado: string;
      medido: Record<string, string>;
      detalle: string;
    };
    expect(linea, h.stdout).toMatchObject({
      paso: 'H-10',
      resultado: 'pasa',
      detalle: '',
      medido: {
        jwks: 'ES256',
        aal: 'aal2',
        borrar_factores: 'pasa',
        factores: '0',
        sesiones_abiertas: '0',
        registro: 'cerrado',
        usuario_borrado: 'si',
      },
    });
    expect(Number(linea.medido['jwt_vence_s'])).toBeGreaterThan(0);
    expect(usuariosAuth()).toBe(antes);
    expect(h.status).toBe(0);
  }, 300_000);
});
