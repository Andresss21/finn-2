// tools/db/plantilla.ts — C3, C5 y C6 de 03 §11.6 sobre finn_plantilla (TA-051, CH-21; 07 §5.2, paso 4).
// El arnés (packages/db/test/ayudantes/base.ts) ya corrió el bootstrap; aquí, como finn_migraciones:
//   C3 `prisma migrate deploy` desde cero, y todas las carpetas quedan aplicadas;
//   C5 `reglas-catalogo.sql` (R1–R14) sin filas;
//   C6 `catalogo.sql` igual a `packages/db/prisma/catalogo-esperado.txt`.
// En ese orden; el primero que falla lanza un error y Vitest termina sin correr pruebas.
// Las consultas llegan por `Consultar` (el paquete `pg` vive en @finn/db, no en la raíz).
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Ejecuta un script SQL y devuelve sus filas como psql `-A -t`: columnas unidas con `|`. */
export type Consultar = (url: string, sql: string) => Promise<string[]>;

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const paqueteDb = join(raiz, 'packages', 'db');
const migraciones = join(paqueteDb, 'prisma', 'migrations');
const leer = (ruta: string): string => readFileSync(join(raiz, ruta), 'utf8');

/** La CLI de Prisma de @finn/db (versión fijada en su package.json). */
function cliPrisma(): string {
  const req = createRequire(join(paqueteDb, 'package.json'));
  return join(dirname(req.resolve('prisma/package.json')), 'build', 'index.js');
}

/** C3: `prisma migrate deploy` como el rol de `url`; después, ninguna carpeta queda sin aplicar. */
export async function c3(url: string, consultar: Consultar): Promise<void> {
  const salida: string[] = [];
  const codigo = await new Promise<number | null>((fin, error) => {
    const hijo = spawn(process.execPath, [cliPrisma(), 'migrate', 'deploy'], {
      cwd: paqueteDb,
      env: { ...process.env, DIRECT_URL: url },
    });
    hijo.stdout.on('data', (d: Buffer) => salida.push(d.toString()));
    hijo.stderr.on('data', (d: Buffer) => salida.push(d.toString()));
    hijo.on('error', error);
    hijo.on('exit', fin);
  });
  if (codigo !== 0) throw new Error(`C3: prisma migrate deploy salió con ${codigo}\n${salida.join('')}`);
  const carpetas = readdirSync(migraciones, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const aplicadas = await consultar(
    url,
    `SELECT migration_name FROM finn._prisma_migrations
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`,
  );
  const faltan = carpetas.filter((c) => !aplicadas.includes(c));
  if (faltan.length) throw new Error(`C3: migraciones sin aplicar: ${faltan.join(', ')}`);
}

/** C5: las violaciones de R1–R14; vacío si el esquema cumple. */
export const c5 = (url: string, consultar: Consultar): Promise<string[]> =>
  consultar(url, leer('tools/db/reglas-catalogo.sql'));

/** C6: diferencias entre `catalogo.sql` y la instantánea (`-` falta en la base, `+` sobra). */
export async function c6(url: string, consultar: Consultar): Promise<string[]> {
  const actual = await consultar(url, leer('tools/db/catalogo.sql'));
  const esperado = leer('packages/db/prisma/catalogo-esperado.txt')
    .split('\n')
    .filter((l) => l !== '');
  const hay = new Set(actual);
  const debe = new Set(esperado);
  return [
    ...esperado.filter((l) => !hay.has(l)).map((l) => `- ${l}`),
    ...actual.filter((l) => !debe.has(l)).map((l) => `+ ${l}`),
  ];
}

/** El gancho de la plantilla: C3, C5 y C6, en ese orden; el primero que falla corta. */
export async function prepararPlantilla(url: string, consultar: Consultar): Promise<void> {
  await c3(url, consultar);
  const reglas = await c5(url, consultar);
  if (reglas.length) throw new Error(`C5: reglas de catálogo violadas:\n${reglas.join('\n')}`);
  const diferencias = await c6(url, consultar);
  if (diferencias.length)
    throw new Error(
      `C6: el catálogo no coincide con catalogo-esperado.txt (03 §11.5, paso 5):\n${diferencias.join('\n')}`,
    );
}
