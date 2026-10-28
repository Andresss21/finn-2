// tools/db/c4.mjs — C4 de 03 §11.6: diff de Prisma entre la base y schema.prisma (TA-052; 07 §32.1).
//   prisma migrate diff --from-config-datasource --to-schema <schema.prisma> --script --exit-code
// con la CLI nativa de Prisma 7 de @finn/db y DIRECT_URL como la base (finn_migraciones). Sale con el código
// de Prisma: 0 sin diferencias, 2 con diferencias (el diff pasa por c4-explicar.mjs), 1 si falla.
// El gancho de la plantilla (tools/db/plantilla.ts) lo corre después de C3, en el job `integracion`; en CI,
// un informe distinto de vacío va también al resumen del job ($GITHUB_STEP_SUMMARY).
// Uso: DIRECT_URL=… node tools/db/c4.mjs [--esquema <ruta a schema.prisma>]
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { explicar } from './c4-explicar.mjs';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const paqueteDb = join(raiz, 'packages', 'db');
export const ESQUEMA = join(paqueteDb, 'prisma', 'schema.prisma');

/** La CLI de Prisma de @finn/db (versión fijada en su package.json). */
function cliPrisma() {
  const req = createRequire(join(paqueteDb, 'package.json'));
  return join(dirname(req.resolve('prisma/package.json')), 'build', 'index.js');
}

/** C4 sobre `url`: `{ codigo, diff, error }`, con `diff` el SQL que Prisma generaría. */
export function c4(url, esquema = ESQUEMA) {
  const args = ['migrate', 'diff', '--from-config-datasource', '--to-schema', esquema];
  return new Promise((fin, falla) => {
    const [diff, error] = [[], []];
    const hijo = spawn(process.execPath, [cliPrisma(), ...args, '--script', '--exit-code'], {
      cwd: paqueteDb,
      env: { ...process.env, DIRECT_URL: url },
    });
    hijo.stdout.on('data', (d) => diff.push(d.toString()));
    hijo.stderr.on('data', (d) => error.push(d.toString()));
    hijo.on('error', falla);
    hijo.on('exit', (codigo) => fin({ codigo, diff: diff.join(''), error: error.join('') }));
  });
}

/** El texto del informe de C4 para un resultado de `c4()`. */
export function informe({ codigo, diff, error }) {
  if (codigo === 0) return 'C4: sin diferencias entre la base y schema.prisma\n';
  if (codigo === 2)
    return `C4: schema.prisma no corresponde a las migraciones (03 §11.6); Prisma generaría:\n${explicar(diff)}`;
  return `C4: prisma migrate diff salió con ${codigo}\n${error}${diff}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const url = process.env['DIRECT_URL'];
  const i = process.argv.indexOf('--esquema');
  const esquema = i > 0 ? resolve(process.argv[i + 1] ?? '') : ESQUEMA;
  if (!url) {
    process.stderr.write('C4: falta DIRECT_URL (la base migrada, como finn_migraciones)\n');
    process.exit(1);
  }
  const r = await c4(url, esquema);
  const texto = informe(r);
  (r.codigo === 0 ? process.stdout : process.stderr).write(texto);
  const resumen = process.env['GITHUB_STEP_SUMMARY'];
  if (r.codigo !== 0 && resumen) appendFileSync(resumen, ['', '```', texto + '```', ''].join('\n'));
  process.exit(r.codigo ?? 1);
}
