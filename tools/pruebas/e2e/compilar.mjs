// La compilación de la E2E (CH-66): `next build` con DATABASE_URL en un puerto cerrado. Si una página ejecuta la puesta al
// día u otra consulta al compilar, la compilación falla y la E2E no arranca. `next start` usa la URL real del entorno.
// No basta con leer `.next/prerender-manifest.json`: Next 16.4.1 ejecuta el `after()` al intentar prerenderizar una página
// y aun así puede dejarla como dinámica en el manifiesto.
import { spawnSync } from 'node:child_process';

const r = spawnSync('pnpm', ['exec', 'next', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DATABASE_URL: 'postgresql://finn_app@127.0.0.1:1/postgres' },
});
process.exit(r.status ?? 1);
