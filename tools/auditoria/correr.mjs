// Corre capturas de la auditoría contra el servidor de `servir.mjs`. Los argumentos pasan a Playwright:
//   node tools/auditoria/correr.mjs --project=telefono-claro -g "inicio"
// Un solo proceso a la vez: todas las capturas comparten la base finn_e2e y el reloj del servidor.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tomarCandado } from '../pruebas/e2e/candado.ts';

const aqui = dirname(fileURLToPath(import.meta.url));
const web = join(aqui, '..', '..', 'apps', 'web');
// Candado propio (no el de la E2E, que lo tiene servir.mjs): ordena a los agentes que capturan a la vez
const soltar = await tomarCandado({
  ruta: 'C:/finn/auditoria-capturas.lock',
  alEsperar: (d) => console.log(`capturas: espera al proceso ${d.pid}`),
});
let codigo = 1;
try {
  const r = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '--config', join(aqui, 'playwright.config.ts'), ...process.argv.slice(2)].map((a) =>
      // con `shell` en Windows, cmd parte los argumentos con | & < > y espacios
      process.platform === 'win32' && /[\s|&<>^()]/.test(a) ? `"${a}"` : a,
    ),
    { cwd: web, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  codigo = r.status ?? 1;
} finally {
  soltar();
}
process.exit(codigo);
