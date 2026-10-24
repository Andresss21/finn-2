// tools/respaldo/respaldar.mjs — volcado con conteos en la misma instantánea (03-base-de-datos.md, 12.1).
// Uso: node tools/respaldo/respaldar.mjs "<URL de finn_respaldo>" <archivo.dump>
import pg from 'pg';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [url, salida] = process.argv.slice(2);
const c = new pg.Client({ connectionString: url });
await c.connect();
await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
const snap = (await c.query('SELECT pg_export_snapshot() AS s')).rows[0].s;
const tablas = (await c.query(`SELECT relname FROM pg_class WHERE relnamespace = 'finn'::regnamespace AND relkind = 'r' ORDER BY relname`)).rows.map(r => r.relname);
const conteos = {};
for (const t of tablas) conteos[t] = Number((await c.query(`SELECT count(*) FROM finn."${t}"`)).rows[0].count);
const revision = (await c.query('SELECT valor FROM finn.revision')).rows[0].valor;
execFileSync('pg_dump', ['--dbname', url, '--format=custom', '--schema=finn', `--snapshot=${snap}`, '--file', salida], { stdio: 'inherit' });
await c.query('COMMIT'); await c.end();
fs.writeFileSync(salida + '.manifiesto.json', JSON.stringify({ revision, conteos }, null, 1));
console.log('volcado y manifiesto listos; revisión', revision, '; tablas', tablas.length);
