// Envoltorio de `pnpm test:e2e`: pnpm entrega `--` como argumento literal y Playwright lo toma como
// fin de opciones, así que `pnpm test:e2e -- --project=movil` (07 §2.3) no funcionaría sin quitarlo.
// El candado de la E2E local (DT-22) se agrega aquí cuando exista (TA-010).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'web');
const args = process.argv.slice(2).filter((a, i) => !(a === '--' && i === 0));
const r = spawnSync('pnpm', ['exec', 'playwright', 'test', '--pass-with-no-tests', ...args], {
  cwd: web,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
