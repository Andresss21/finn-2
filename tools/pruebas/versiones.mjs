// Control de versiones (07 §5.1, DP-06): nada puede contradecir infra/versiones.env.
// Uso: node tools/pruebas/versiones.mjs [raiz]
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerVersiones } from './leer-versiones.mjs';

const raiz = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const v = leerVersiones(raiz);
const errores = [];

for (const k of ['PG_MAYOR', 'PG_IMAGEN_DIGEST', 'NODE', 'PLAYWRIGHT', 'SUPABASE_CLI']) {
  if (!v[k]) errores.push(`infra/versiones.env: falta ${k}`);
}
// CH-22: la imagen de PostgreSQL de CI se baja por digest del índice
if (v.PG_IMAGEN_DIGEST && !/^sha256:[0-9a-f]{64}$/.test(v.PG_IMAGEN_DIGEST)) {
  errores.push(`infra/versiones.env: PG_IMAGEN_DIGEST=${v.PG_IMAGEN_DIGEST} no es sha256:<64 hex>`);
}

// supabase/config.toml: db.major_version
const rutaToml = join(raiz, 'supabase', 'config.toml');
if (!existsSync(rutaToml)) {
  errores.push('supabase/config.toml no existe');
} else {
  const toml = readFileSync(rutaToml, 'utf8');
  const db = /^\[db\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(toml);
  const m = db ? /^major_version\s*=\s*(\d+)\s*$/m.exec(db[1]) : null;
  if (!m) errores.push('supabase/config.toml: no se encontró db.major_version');
  else if (m[1] !== v.PG_MAYOR) {
    errores.push(
      `supabase/config.toml: db.major_version=${m[1]}, versiones.env dice PG_MAYOR=${v.PG_MAYOR}`,
    );
  }
}

// package.json: engines.node
const rutaPkg = join(raiz, 'package.json');
if (!existsSync(rutaPkg)) {
  errores.push('package.json no existe');
} else {
  const node = JSON.parse(readFileSync(rutaPkg, 'utf8')).engines?.node;
  if (node !== `${v.NODE}.x`) {
    errores.push(
      `package.json: engines.node=${node}, versiones.env dice NODE=${v.NODE} (se espera ${v.NODE}.x)`,
    );
  }
}

// pnpm-lock.yaml: @playwright/test (si ya está en el lockfile)
const rutaLock = join(raiz, 'pnpm-lock.yaml');
if (existsSync(rutaLock) && v.PLAYWRIGHT) {
  const trozos = v.PLAYWRIGHT.split('.').map((t) => (t === 'x' ? '[0-9]+' : t));
  const patron = new RegExp(`^${trozos.join('[.]')}$`);
  const lock = readFileSync(rutaLock, 'utf8');
  for (const m of lock.matchAll(/@playwright\/test@(\d+\.\d+\.\d+)/g)) {
    if (!patron.test(m[1])) {
      errores.push(
        `pnpm-lock.yaml: @playwright/test@${m[1]}, versiones.env dice PLAYWRIGHT=${v.PLAYWRIGHT}`,
      );
    }
  }
}

if (errores.length > 0) {
  for (const e of errores) console.error(`versiones: ${e}`);
  process.exit(1);
}
console.log('versiones: ok');
