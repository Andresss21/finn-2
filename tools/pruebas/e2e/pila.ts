// Pila local mínima de la E2E (TA-219; 07 §5.3, DP-07): `supabase start -x …` deja `db`, `auth` y `kong`. Encima, como en
// `integracion`: bootstrap.sql, `prisma migrate deploy` (C3) sobre finn_plantilla y una copia, finn_e2e, marcada como base
// de prueba y con reloj-simulado.sql (07 §5.2, CT-02). La app se conecta directo a finn_e2e como finn_app.
// La CLI se invoca con `npx` en la versión de infra/versiones.env (DP-06), igual en la PC y en CI.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { c3, type Consultar } from '../../db/plantilla.ts';
import { crearUsuario, crearUsuarioNoPermitido } from './usuario.ts';

const raiz = fileURLToPath(new URL('../../..', import.meta.url));
const [HOST, PUERTO_DB] = ['127.0.0.1', 54322];
const CONTENEDOR = 'supabase_db_finn';
const BASE_E2E = 'finn_e2e';
const PLANTILLA = 'finn_plantilla';
// Claves de prueba de la pila efímera; `postgres` es la de toda pila local de Supabase. No existen fuera de ella.
const CLAVES = { admin: 'postgres', migraciones: 'arnes-migraciones', app: 'arnes-app' };
// El superusuario, como dice bootstrap.sql para local: `postgres` no puede ni SET ROLE ni fijar finn.reloj_simulado
const USUARIO_ADMIN = 'supabase_admin';
const USUARIOS = { admin: USUARIO_ADMIN, migraciones: 'finn_migraciones', app: 'finn_app' };
type Rol = keyof typeof CLAVES;

export const EXCLUIDOS = [
  'studio',
  'realtime',
  'storage-api',
  'imgproxy',
  'edge-runtime',
  'logflare',
  'vector',
  'postgres-meta',
  'supavisor',
  'postgrest',
  'mailpit',
];

const leer = (ruta: string): string => readFileSync(`${raiz}${ruta}`, 'utf8');
const urlDe = (base: string, rol: Rol): string =>
  `postgresql://${USUARIOS[rol]}:${CLAVES[rol]}@${HOST}:${PUERTO_DB}/${base}`;

function supabase(...args: string[]): { ok: boolean; salida: string } {
  const version = /^SUPABASE_CLI=(\S+)\s*$/m.exec(leer('infra/versiones.env'))?.[1];
  const r = spawnSync('npx', ['--yes', `supabase@${version}`, ...args], {
    cwd: raiz,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 16 * 1024 * 1024,
  });
  return { ok: r.status === 0, salida: `${r.stdout}\n${r.stderr}` };
}

/** psql dentro del contenedor (la PC no lo tiene instalado); filas como `-A -t`, columnas unidas con `|`. */
function psql(url: string, sql: string, variables: Record<string, string> = {}): string[] {
  const u = new URL(url);
  const vars = Object.entries(variables).flatMap(([k, v]) => ['-v', `${k}=${v}`]);
  const r = spawnSync(
    'docker',
    [
      ...['exec', '-i', '-e', `PGPASSWORD=${decodeURIComponent(u.password)}`, CONTENEDOR],
      ...['psql', '-h', '127.0.0.1', '-U', u.username, '-d', u.pathname.slice(1)],
      ...['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', ...vars, '-f', '-'],
    ],
    { input: sql, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(`psql en ${u.pathname}: ${r.stderr}`);
  return r.stdout.split('\n').filter((l) => l !== '');
}

const consultar: Consultar = (url, sql) => Promise.resolve(psql(url, sql));

async function prepararBase(): Promise<void> {
  psql(urlDe('postgres', 'admin'), `CREATE DATABASE ${PLANTILLA}`);
  psql(urlDe(PLANTILLA, 'admin'), leer('tools/db/bootstrap.sql'), {
    clave_migraciones: CLAVES.migraciones,
    clave_app: CLAVES.app,
    clave_respaldo: 'arnes-respaldo',
  });
  await c3(urlDe(PLANTILLA, 'migraciones'), consultar);
  psql(
    urlDe('postgres', 'admin'),
    `CREATE DATABASE ${BASE_E2E} TEMPLATE ${PLANTILLA};
     ALTER DATABASE ${BASE_E2E} SET finn.reloj_simulado = on;`,
  );
  psql(urlDe(BASE_E2E, 'migraciones'), leer('tools/pruebas/reloj-simulado.sql'));
}

/** 07 §7.1: se espera la salud del servicio con tiempo máximo, no un tiempo fijo. */
async function esperarAuth(url: string, clave: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const r = await fetch(`${url}/auth/v1/health`, { headers: { apikey: clave } }).catch(
      () => null,
    );
    if (r?.ok) return;
    await esperar(500);
  }
  throw new Error('pila E2E: /auth/v1/health no respondió a tiempo');
}

/** Baja la pila y borra sus volúmenes: cada corrida empieza de una base limpia. */
export const bajarPila = (): void => {
  supabase('stop', '--no-backup');
};

/** Levanta la pila y devuelve las variables que necesitan `next start` y las ayudas de la E2E. */
export async function levantarPila(): Promise<Record<string, string>> {
  bajarPila(); // una corrida cortada puede haberla dejado arriba
  const inicio = supabase('start', '-x', EXCLUIDOS.join(','));
  if (!inicio.ok) throw new Error(`pila E2E: supabase start falló\n${inicio.salida}`);
  const estado = supabase('status', '-o', 'json');
  const json = /\{[\s\S]*\}/.exec(estado.salida)?.[0];
  if (!estado.ok || !json) throw new Error('pila E2E: supabase status no devolvió el estado');
  const s = JSON.parse(json) as Record<string, string>;
  const [url, clavePublica, claveServicio] = [s['API_URL'], s['ANON_KEY'], s['SERVICE_ROLE_KEY']];
  if (!url || !clavePublica || !claveServicio)
    throw new Error('pila E2E: supabase status no trae API_URL, ANON_KEY y SERVICE_ROLE_KEY');
  await esperarAuth(url, clavePublica);
  await prepararBase();
  const usuario = await crearUsuario({ url, clavePublica, claveServicio });
  const otro = await crearUsuarioNoPermitido({ url, clavePublica, claveServicio });
  return {
    DATABASE_URL: urlDe(BASE_E2E, 'app'),
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: clavePublica,
    FINN_USUARIO_ID: usuario.id,
    E2E_EMAIL: usuario.email,
    E2E_CLAVE: usuario.clave,
    E2E_TOTP_SECRETO: usuario.secretoTotp,
    E2E_OTRO_EMAIL: otro.email,
    E2E_OTRO_CLAVE: otro.clave,
    // La conexión del ejecutor `int` (packages/db/test/ayudantes/conexion.ts), para `sembrar`
    FINN_ARNES_PG: JSON.stringify({
      host: HOST,
      puerto: PUERTO_DB,
      claves: CLAVES,
      usuarioAdmin: USUARIO_ADMIN,
    }),
  };
}

/** Lo que dice la base con el reloj que el servidor fija por transacción (`set_config(…, true)`, 07 §4.1). */
export function relojDeLaBase(reloj: { hoy: string; desfaseMs: number }): {
  hoy: string;
  ahora: string;
} {
  const filas = psql(
    urlDe(BASE_E2E, 'app'),
    `BEGIN;
     SELECT set_config('finn.hoy', '${reloj.hoy}', true), set_config('finn.desfase_ms', '${reloj.desfaseMs}', true);
     SELECT finn.hoy(), finn.ahora();
     COMMIT;`,
  );
  const [hoy = '', ahora = ''] = (filas.at(-1) ?? '').split('|');
  return { hoy, ahora };
}

/** Cuántos eventos de sistema nombran `texto` en el mensaje o en los datos (CA-02.2: el secreto no se registra). */
export function eventosQueNombran(texto: string): number {
  const filas = psql(
    urlDe(BASE_E2E, 'admin'),
    `SELECT count(*) FROM finn.eventos_sistema WHERE mensaje LIKE '%' || :'t' || '%' OR datos::text LIKE '%' || :'t' || '%';`,
    { t: texto },
  );
  return Number(filas[0] ?? 'NaN');
}
