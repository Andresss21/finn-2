#!/bin/bash
set +x
# H-05 (04 §17.2; 03 §13.4, §11.6): las migraciones con la CLI nativa de Prisma 7, como finn_migraciones por el
# puerto de sesión, y C3 a C6 de B1 con las mismas funciones que el gancho de la plantilla (tools/db/plantilla.ts):
# C3 `prisma migrate deploy` y todas las carpetas aplicadas, C4 `migrate diff --exit-code` vacío, C5 0 filas en
# R1–R15 y C6 0 diferencias con catalogo-esperado.txt. Cada control corre aunque falle el anterior.
. "$(dirname "$0")/comun.sh"
HUMO_URL_MIGRACIONES="$(url finn_migraciones "$HUMO_PUERTO_SESION")" node --input-type=module - <<'EOF'
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const raiz = process.cwd();
const { c3, c4, c5, c6 } = await import(pathToFileURL(join(raiz, 'tools/db/plantilla.ts')).href);
const pg = createRequire(join(raiz, 'packages/db/package.json'))('pg');
const url = process.env.HUMO_URL_MIGRACIONES;
/** Como `consultar` del arnés: filas como psql `-A -t`. */
async function consultar(u, sql) {
  const c = new pg.Client({ connectionString: u });
  await c.connect();
  try {
    const r = await c.query({ text: sql, rowMode: 'array' });
    return (Array.isArray(r) ? r : [r]).flatMap((x) => x.rows.map((f) => f.map((v) => (v === null ? '' : String(v))).join('|')));
  } finally {
    await c.end();
  }
}
const sinFilas = (nombre, filas) => {
  if (filas.length) throw new Error(`${nombre}: ${filas.length} filas: ${filas.slice(0, 5).join(' | ')}`);
};
let mal = 0;
for (const [nombre, control] of [
  ['C3', () => c3(url, consultar)],
  ['C4', () => c4(url)],
  ['C5', async () => sinFilas('C5', await c5(url, consultar))],
  ['C6', async () => sinFilas('C6', await c6(url, consultar))],
]) {
  try {
    await control();
    console.log(`medido ${nombre} pasa`);
  } catch (e) {
    mal++;
    console.log(`medido ${nombre} falla`);
    console.log(`detalle ${String(e?.message ?? e).split('\n').filter(Boolean).slice(0, 6).join(' | ')}`);
  }
}
const [n] = await consultar(url, 'SELECT count(*) FROM finn._prisma_migrations WHERE finished_at IS NOT NULL').catch(() => ['?']);
console.log(`medido migraciones ${n}`);
if (mal) console.log('detalle revisar el hallazgo según el control que falló (03 §11.6); diff por objeto manual: RK-19');
process.exit(mal ? 1 : 0);
EOF
