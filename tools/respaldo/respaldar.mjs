// tools/respaldo/respaldar.mjs — volcado con conteos en la misma instantánea (03-base-de-datos.md, 12.1).
// Uso: node tools/respaldo/respaldar.mjs "<URL de finn_respaldo>" <archivo.dump>
// Portado de la Fase 3 (TA-251) con dos ajustes: `pg` se resuelve desde @finn/db, el único paquete que lo declara
// (ADR-21), y FINN_PG_EXEC antepone un comando al cliente (la prueba RES corre pg_dump en un contenedor, 07 §19.6).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const pg = createRequire(new URL('../../packages/db/package.json', import.meta.url))('pg');
const [cmd, ...pre] = [...(process.env.FINN_PG_EXEC ?? '').split(' ').filter(Boolean), 'pg_dump'];
const [url, salida] = process.argv.slice(2);
const c = new pg.Client({ connectionString: url });
await c.connect();
await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
const snap = (await c.query('SELECT pg_export_snapshot() AS s')).rows[0].s;
const tablas = (
  await c.query(
    `SELECT relname FROM pg_class WHERE relnamespace = 'finn'::regnamespace AND relkind = 'r' ORDER BY relname`,
  )
).rows.map((r) => r.relname);
const conteos = {};
for (const t of tablas)
  conteos[t] = Number((await c.query(`SELECT count(*) FROM finn."${t}"`)).rows[0].count);
const revision = (await c.query('SELECT valor FROM finn.revision')).rows[0].valor;
execFileSync(
  cmd,
  [
    ...pre,
    '--dbname',
    url,
    '--format=custom',
    '--schema=finn',
    `--snapshot=${snap}`,
    '--file',
    salida,
  ],
  { stdio: 'inherit' },
);
await c.query('COMMIT');
await c.end();
fs.writeFileSync(salida + '.manifiesto.json', JSON.stringify({ revision, conteos }, null, 1));
console.log('volcado y manifiesto listos; revisión', revision, '; tablas', tablas.length);
