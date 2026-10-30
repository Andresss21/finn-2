// `pnpm test:e2e` (TA-219, DT-22): toma el candado, levanta la pila local, crea el usuario de prueba, corre Playwright y
// suelta todo al terminar. Sin `--project` corre `movil`, el único de PR y de `main` (07 §3.2); los otros son del nocturno.
// pnpm entrega `--` como argumento literal y Playwright lo toma como fin de opciones: se quita.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rutaCandado, tomarCandado } from './e2e/candado.ts';
import { bajarPila, levantarPila } from './e2e/pila.ts';
import { borrarRelojServidor } from './e2e/reloj.ts';

const web = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'web');
const args = process.argv.slice(2).filter((a, i) => !(a === '--' && i === 0));
const proyecto = args.some((a) => a.startsWith('--project')) ? [] : ['--project=movil'];

const soltar = await tomarCandado({
  alEsperar: (d) =>
    console.log(`e2e: ${rutaCandado()} lo tiene el proceso ${d.pid} desde ${d.desde}; esperando`),
});
for (const senal of ['SIGINT', 'SIGTERM'])
  process.on(senal, () => {
    soltar();
    process.exit(130);
  });

let codigo = 1;
try {
  console.log('e2e: levantando la pila local');
  const entorno = await levantarPila();
  borrarRelojServidor();
  const r = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '--pass-with-no-tests', ...proyecto, ...args],
    {
      cwd: web,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, ...entorno },
    },
  );
  codigo = r.status ?? 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
} finally {
  bajarPila();
  soltar();
}
process.exit(codigo);
