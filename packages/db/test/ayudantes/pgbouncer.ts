// PgBouncer de PRU-INT-POOL (TA-059; 07 §5.3, V7-05; CH-05): hace de Supavisor en modo transacción.
// - `levantarPgBouncer(base)`: en un `beforeAll`, un contenedor de PgBouncer con `infra/pgbouncer.ini` delante del
//   PostgreSQL del arnés (base.ts); un `afterAll` lo detiene. La imagen sale de `infra/versiones.env` por digest
//   (patrón CH-22): de la caché de CI, del espejo de Google o, si falla, de Docker Hub.
// - `clientePrisma(url)`: Prisma 7 + `@prisma/adapter-pg` sobre la URL del pooler (`pgbouncer=true`); genera el
//   cliente en `packages/db/src/generado/` (ignorado por git) la primera vez.
// - `conLibre(url, elegir, fn)`: corre `fn` con una sola conexión de servidor libre en el pool, la que `elegir`
//   indique; la otra queda retenida en una transacción abierta. Así cada prueba decide en qué conexión del
//   servidor cae la siguiente transacción, sin esperas ni azar (07 §7.1).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import pg from 'pg';
import { afterAll, beforeAll, inject } from 'vitest';
import type { BasePrueba } from './base.ts';

const raiz = (r: string): string => fileURLToPath(new URL(`../../../../${r}`, import.meta.url));
const PUERTO = 6432;
// Orígenes de la imagen, siempre por digest: el espejo de Google no limita a los runners como Docker Hub
const ORIGENES = ['mirror.gcr.io/', 'docker.io/'];
const CACHE = join(homedir(), '.cache', 'finn-pgbouncer', 'pgbouncer.tar');

/** PGBOUNCER_IMAGEN y PGBOUNCER_IMAGEN_DIGEST de infra/versiones.env (07 §5.1). */
export function imagenPgBouncer(): { imagen: string; digest: string } {
  const env = readFileSync(raiz('infra/versiones.env'), 'utf8');
  const imagen = /^PGBOUNCER_IMAGEN=(\S+)\s*$/m.exec(env)?.[1];
  const digest = /^PGBOUNCER_IMAGEN_DIGEST=(sha256:[0-9a-f]{64})\s*$/m.exec(env)?.[1];
  if (!imagen || !digest) throw new Error('infra/versiones.env no tiene PGBOUNCER_IMAGEN(_DIGEST)');
  return { imagen, digest };
}

const docker = (...args: string[]): { ok: boolean; salida: string } => {
  const r = spawnSync('docker', args, { encoding: 'utf8' });
  return { ok: r.status === 0, salida: `${r.stdout}${r.stderr}` };
};
const esperar = (ms: number): Promise<void> => new Promise((listo) => setTimeout(listo, ms));

/**
 * Deja la imagen etiquetada como `imagen` solo si su contenido es el del digest. Orden de CH-22: caché de CI
 * (`~/.cache/finn-pgbouncer`, la guarda actions/cache), 3 intentos con espera creciente en el primer origen y
 * el segundo origen. No es una espera de prueba: es la descarga de la herramienta, antes de las pruebas.
 */
export async function asegurarImagen(): Promise<string> {
  const { imagen, digest } = imagenPgBouncer();
  const tieneDigest = (): boolean =>
    docker('image', 'inspect', '--format', '{{json .RepoDigests}}', imagen).salida.includes(digest);
  if (tieneDigest()) return imagen;
  if (existsSync(CACHE) && docker('load', '-i', CACHE).ok && tieneDigest()) return imagen;
  const repo = imagen.replace(/:[^/:]+$/, '');
  const intentos = ORIGENES.flatMap((o, k) => (k === 0 ? [o, o, o] : [o]));
  let fallo = '';
  for (const [k, origen] of intentos.entries()) {
    const ref = `${origen}${repo}@${digest}`;
    const r = docker('pull', ref);
    if (r.ok && docker('tag', ref, imagen).ok) {
      if (process.env['CI']) {
        mkdirSync(dirname(CACHE), { recursive: true });
        docker('save', '-o', CACHE, imagen);
      }
      return imagen;
    }
    fallo = r.salida;
    if (k < 2) await esperar((k + 1) * 15_000);
  }
  throw new Error(`No se pudo bajar ${repo}@${digest}:\n${fallo}`);
}

/**
 * IPv4 del contenedor de PostgreSQL del arnés en la red `bridge`, buscado por su puerto publicado: PgBouncer
 * llega directo al 5432 de ese contenedor. Por el anfitrión (`host-gateway`) el nombre resuelve también a IPv6,
 * PgBouncer prueba esa dirección primero y espera `server_login_retry` (15 s) antes de la siguiente.
 */
function ipDelArnes(puertoPublicado: number): string {
  const id = docker('ps', '-q', '--filter', `publish=${puertoPublicado}`).salida.trim();
  const ip = docker('inspect', '-f', '{{.NetworkSettings.Networks.bridge.IPAddress}}', id).salida.trim();
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip))
    throw new Error(`No se encontró el PostgreSQL del arnés en el puerto ${puertoPublicado}: ${id} ${ip}`);
  return ip;
}

export type PgBouncer = {
  /** URL del pooler para `rol` finn_app en la base de prueba; Prisma la recibe con `pgbouncer=true`. */
  readonly url: string;
  /** La misma URL para otra base del contenedor: el pooler tiene una base comodín. */
  urlDe(base: string): string;
};

/**
 * PgBouncer delante de `base`, en un `beforeAll`; un `afterAll` lo detiene. Llamar después de
 * `crearBasePrueba()`: los `afterAll` corren en orden inverso y el pooler se detiene antes de borrar la base.
 */
export function levantarPgBouncer(base: BasePrueba): PgBouncer {
  let detener: (() => Promise<unknown>) | undefined;
  let puerto = 0;
  let host = '';
  beforeAll(async () => {
    const imagen = await asegurarImagen();
    const { GenericContainer, Wait } = await import('testcontainers');
    const pgArnes = inject('finnPg');
    const ini = readFileSync(raiz('infra/pgbouncer.ini'), 'utf8')
      .replaceAll('@PG_HOST@', ipDelArnes(pgArnes.puerto))
      .replaceAll('@PG_PUERTO@', '5432');
    const c = await new GenericContainer(imagen)
      .withEntrypoint(['/usr/bin/pgbouncer'])
      .withCommand(['/etc/pgbouncer/pgbouncer.ini'])
      .withCopyContentToContainer([
        { content: ini, target: '/etc/pgbouncer/pgbouncer.ini', mode: 0o644 },
        // auth_type = trust: el pooler usa esta clave para entrar a la base, no para los clientes
        {
          content: `"finn_app" "${pgArnes.claves.app}"\n`,
          target: '/etc/pgbouncer/usuarios.txt',
          mode: 0o644,
        },
      ])
      .withExposedPorts(PUERTO)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();
    host = c.getHost();
    puerto = c.getMappedPort(PUERTO);
    detener = () => c.stop();
  }, 300_000);
  afterAll(async () => {
    await detener?.();
  });
  const urlDe = (nombre: string): string =>
    `postgresql://finn_app:${inject('finnPg').claves.app}@${host}:${puerto}/${nombre}`;
  return {
    get url() {
      return urlDe(base.nombre);
    },
    urlDe,
  };
}

/** Lo que las pruebas usan del cliente generado; se importa en ejecución porque `generado/` no se versiona. */
export type Tx = {
  $executeRaw(q: TemplateStringsArray, ...v: unknown[]): Promise<number>;
  $queryRaw<T = unknown>(q: TemplateStringsArray, ...v: unknown[]): Promise<T>;
  deudor: { create(a: { data: { nombre: string } }): Promise<{ id: string }> };
  asignacion: {
    create(a: {
      data: { categoriaId: string; periodoInicio: Date; monto: number };
    }): Promise<{ id: string }>;
  };
};
export type ClientePrisma = {
  $transaction<T>(
    fn: (tx: Tx) => Promise<T>,
    o?: { isolationLevel?: string; timeout?: number; maxWait?: number },
  ): Promise<T>;
  $disconnect(): Promise<void>;
};

const paqueteDb = raiz('packages/db');
const clienteGenerado = join(paqueteDb, 'src', 'generado', 'prisma', 'client.ts');

/** `prisma generate` del esquema de @finn/db (no usa la base: DIRECT_URL solo satisface prisma.config.ts). */
function generarCliente(): void {
  const cli = join(
    dirname(createRequire(join(paqueteDb, 'package.json')).resolve('prisma/package.json')),
    'build',
    'index.js',
  );
  const r = spawnSync(process.execPath, [cli, 'generate'], {
    cwd: paqueteDb,
    encoding: 'utf8',
    env: { ...process.env, DIRECT_URL: 'postgresql://sin-uso@localhost/sin-uso' },
  });
  if (r.status !== 0) throw new Error(`prisma generate salió con ${r.status}:\n${r.stdout}${r.stderr}`);
}

/** Prisma 7 + `@prisma/adapter-pg` sobre el pooler, como en 04 §4.2 (`max: 3`, `pgbouncer=true`). */
export async function clientePrisma(url: string): Promise<ClientePrisma> {
  if (!existsSync(clienteGenerado)) generarCliente();
  const { PrismaClient } = (await import(pathToFileURL(clienteGenerado).href)) as {
    PrismaClient: new (o: { adapter: unknown }) => ClientePrisma;
  };
  const { PrismaPg } = await import('@prisma/adapter-pg');
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: `${url}?pgbouncer=true`, max: 3 }),
  });
}

/** Un cliente de `pg` por el pooler, cerrado al terminar `fn`. */
export async function conCliente<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

export const pidDe = async (c: pg.ClientBase): Promise<number> =>
  (await c.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid;

/**
 * Retiene las dos conexiones de servidor del pool en dos transacciones abiertas, suelta la que `elegir`
 * indique por su `pid` y corre `fn(pid libre)`: mientras `fn` dure, toda transacción por el pooler cae en esa
 * conexión. Al terminar confirma la retenida. Falla si el pool no tiene exactamente 2 conexiones.
 */
export async function conLibre<T>(
  url: string,
  elegir: (pid: number) => boolean,
  fn: (pid: number) => Promise<T>,
): Promise<T> {
  const h = [new pg.Client({ connectionString: url }), new pg.Client({ connectionString: url })];
  await Promise.all(h.map((c) => c.connect()));
  try {
    const pids: number[] = [];
    for (const c of h) {
      await c.query('BEGIN');
      pids.push(await pidDe(c));
    }
    const libre = pids.findIndex(elegir);
    if (new Set(pids).size !== 2 || libre < 0 || pids.filter(elegir).length !== 1)
      throw new Error(`conLibre: conexiones de servidor ${pids.join(',')}, ninguna o dos elegibles`);
    await h[libre]!.query('COMMIT');
    try {
      return await fn(pids[libre]!);
    } finally {
      await h[1 - libre]!.query('COMMIT');
    }
  } finally {
    await Promise.all(h.map((c) => c.end()));
  }
}
