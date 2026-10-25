// Envoltorio de `pnpm test` y `pnpm test:unidad`: corre los proyectos pedidos y, si está `unidad`,
// después el proyecto `unidad-recheck` en una invocación propia, de a un archivo. Así las pruebas que
// ejecutan `recheck` (04 §8.5) no compiten por la CPU con el resto de la suite (ver vitest.config.ts).
// Los demás argumentos (`-t`, `--reporter`, …) van a las dos invocaciones; corren las dos aunque la
// primera falle, y el código de salida es el peor.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fijarSemilla } from './semilla.ts';

// Una sola FC_SEED para las dos invocaciones (07 §7.1): los hijos la heredan del entorno.
fijarSemilla();

// Node directo, sin shell: un `-t` con espacios llega entero también en Windows.
const bin = join(
  dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
  'vitest.mjs',
);

const PROYECTO = 'unidad-recheck';
// pnpm entrega `--` como argumento literal (ver e2e.mjs); va después de los `--project` del script.
const argv = process.argv.slice(2);
const corte = argv.indexOf('--');
const args = corte < 0 ? argv : [...argv.slice(0, corte), ...argv.slice(corte + 1)];

const proyectos = [];
const resto = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i] ?? '';
  if (a === '--project') proyectos.push(args[++i] ?? '');
  else if (a.startsWith('--project=')) proyectos.push(a.slice('--project='.length));
  else resto.push(a);
}

/** Un `--outputFile` común no puede escribirlo la segunda invocación encima de la primera. */
const aparte = (a) =>
  /^--outputFile(\.\w+)?=/.test(a) ? a.replace(/(\.\w+)?$/, (ext) => `-recheck${ext}`) : a;

function vitest(lista, extra) {
  const r = spawnSync(
    process.execPath,
    [bin, 'run', ...lista.flatMap((p) => ['--project', p]), '--passWithNoTests', ...extra],
    { stdio: 'inherit' },
  );
  return r.status ?? 1;
}

let estado = vitest(proyectos, resto);
if (proyectos.includes('unidad')) {
  // Sin cobertura: el umbral de ramas de @finn/dominio (07 §8) es de la primera invocación.
  const segundo = vitest(
    [PROYECTO],
    ['--no-file-parallelism', '--coverage.enabled=false', ...resto.map(aparte)],
  );
  estado = Math.max(estado, segundo);
}
process.exit(estado);
