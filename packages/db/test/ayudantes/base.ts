// Arnés de PostgreSQL de las pruebas de integración (TA-050; 07 §5.2, §5.3; DP-05, DP-07; CH-21).
// - `setup` (globalSetup del proyecto `integracion`): contenedor de PG_MAYOR desde ECR; bootstrap.sql y
//   roles-supabase.sql como superusuario sobre finn_plantilla; el gancho prepararPlantilla (C3, C5, C6).
// - `crearBasePrueba()`: la base de un archivo, clonada de la plantilla y borrada al terminar el archivo.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, inject } from 'vitest';
import type { TestProject } from 'vitest/node';
import { prepararPlantilla as controlarPlantilla, type Consultar } from '../../../../tools/db/plantilla.ts';

export type Rol = 'admin' | 'migraciones' | 'app';
export type ConexionArnes = { host: string; puerto: number; claves: Record<Rol, string> };
export type BasePrueba = { nombre: string; url: string; urlMigraciones: string; urlAdmin: string };

declare module 'vitest' {
  export interface ProvidedContext {
    finnPg: ConexionArnes;
  }
}

const PLANTILLA = 'finn_plantilla';
const USUARIO: Record<Rol, string> = {
  admin: 'postgres',
  migraciones: 'finn_migraciones',
  app: 'finn_app',
};
// Claves de prueba del contenedor efímero; no existen fuera de él
const CLAVES: Record<Rol, string> = {
  admin: 'arnes-admin',
  migraciones: 'arnes-migraciones',
  app: 'arnes-app',
};
const raiz = (r: string): string => fileURLToPath(new URL(`../../../../${r}`, import.meta.url));

/** PG_MAYOR de infra/versiones.env, el único lugar de las versiones (07 §5.1). */
export function pgMayor(): string {
  const m = /^PG_MAYOR=(\d+)\s*$/m.exec(readFileSync(raiz('infra/versiones.env'), 'utf8'));
  if (!m?.[1]) throw new Error('infra/versiones.env no tiene PG_MAYOR');
  return m[1];
}

const url = (c: ConexionArnes, base: string, rol: Rol): string =>
  `postgresql://${USUARIO[rol]}:${c.claves[rol]}@${c.host}:${c.puerto}/${base}`;

/** URL de `base` con `rol`, en el contenedor que preparó `setup`. */
export const urlDe = (base: string, rol: Rol): string => url(inject('finnPg'), base, rol);

/** Un script SQL en una conexión propia, cerrada al terminar; filas como psql `-A -t` (columnas con `|`). */
export const consultar: Consultar = async (urlBase, sql) => {
  const c = new pg.Client({ connectionString: urlBase });
  await c.connect();
  try {
    const r: pg.QueryResult<unknown[]> | pg.QueryResult<unknown[]>[] = await c.query({
      text: sql,
      rowMode: 'array',
    });
    return (Array.isArray(r) ? r : [r]).flatMap((x) =>
      (x.rows ?? []).map((f) => f.map((v) => (v === null ? '' : String(v))).join('|')),
    );
  } finally {
    await c.end();
  }
};

/**
 * Gancho de la plantilla, como finn_migraciones, antes de clonar: `prisma migrate deploy` y C3, C5 y C6
 * (tools/db/plantilla.ts, TA-051, CH-21). Cierra sus conexiones: no se clona una base con sesiones abiertas.
 */
export const prepararPlantilla = (urlMigraciones: string): Promise<void> =>
  controlarPlantilla(urlMigraciones, consultar);

/** globalSetup de `integracion`: si algo falla, Vitest termina sin correr pruebas (07 §5.2, paso 4). */
export async function setup(proyecto: TestProject): Promise<() => Promise<void>> {
  // `vitest list` (pnpm pruebas:listar, 07 §2.1) solo recolecta: no necesita Docker ni descarga la imagen
  if (process.argv.includes('list')) return () => Promise.resolve();
  // En CI el runner es efímero: sin Ryuk no se descarga su imagen de Docker Hub (07 §5.2, paso 1)
  if (process.env['CI']) process.env['TESTCONTAINERS_RYUK_DISABLED'] ??= 'true';
  const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
  const contenedor = await new PostgreSqlContainer(
    `public.ecr.aws/docker/library/postgres:${pgMayor()}`,
  )
    .withDatabase('postgres')
    .withUsername(USUARIO.admin)
    .withPassword(CLAVES.admin)
    .withCopyFilesToContainer([
      { source: raiz('tools/db/bootstrap.sql'), target: '/finn/bootstrap.sql' },
      { source: raiz('tools/pruebas/roles-supabase.sql'), target: '/finn/roles-supabase.sql' },
    ])
    .start();
  const psql = async (base: string, ...args: string[]): Promise<void> => {
    const r = await contenedor.exec(
      ['psql', '-U', USUARIO.admin, '-d', base, '-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args],
      { user: 'postgres' },
    );
    if (r.exitCode !== 0) throw new Error(`psql ${args.join(' ')}: ${r.output}`);
  };
  try {
    await psql('postgres', '-c', `CREATE DATABASE ${PLANTILLA}`);
    await psql(
      PLANTILLA,
      ...['-v', `clave_migraciones=${CLAVES.migraciones}`, '-v', `clave_app=${CLAVES.app}`],
      ...['-v', 'clave_respaldo=arnes-respaldo', '-f', '/finn/bootstrap.sql'],
    );
    await psql(PLANTILLA, '-f', '/finn/roles-supabase.sql');
    const conexion = { host: contenedor.getHost(), puerto: contenedor.getPort(), claves: CLAVES };
    await prepararPlantilla(url(conexion, PLANTILLA, 'migraciones'));
    proyecto.provide('finnPg', conexion);
  } catch (e) {
    await contenedor.stop();
    throw e;
  }
  return async () => {
    await contenedor.stop();
  };
}

async function comoAdmin(sql: string): Promise<void> {
  const c = new pg.Client({ connectionString: urlDe('postgres', 'admin') });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

/** Una base del contenedor por su nombre; las URL se leen en las pruebas, no al recolectar. */
export const baseLlamada = (nombre: string): BasePrueba => ({
  nombre,
  get url() {
    return urlDe(nombre, 'app');
  },
  get urlMigraciones() {
    return urlDe(nombre, 'migraciones');
  },
  get urlAdmin() {
    return urlDe(nombre, 'admin');
  },
});

/**
 * La base de este archivo: `CREATE DATABASE … TEMPLATE finn_plantilla`, marcada con
 * `finn.reloj_simulado = on`, en un `beforeAll`; un `afterAll` la borra al terminar el archivo. Se llama
 * al cargar el archivo (fuera de una prueba o un hook); recolectar no toca la base.
 */
export function crearBasePrueba(): BasePrueba {
  const nombre = `finn_p_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => {
    await comoAdmin(`CREATE DATABASE ${nombre} TEMPLATE ${PLANTILLA}`);
    await comoAdmin(`ALTER DATABASE ${nombre} SET finn.reloj_simulado = on`);
  });
  afterAll(() => comoAdmin(`DROP DATABASE IF EXISTS ${nombre} WITH (FORCE)`));
  return baseLlamada(nombre);
}
