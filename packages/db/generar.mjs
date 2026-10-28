// `prisma generate` de @finn/db en `src/generado/` (no se versiona; 04 §1.2). Corre en el postinstall del paquete,
// así `typecheck`, las pruebas y `cliente.ts` encuentran el cliente después de `pnpm install` (TA-150).
// No usa la base: `prisma.config.ts` exige DIRECT_URL y, si falta, recibe un valor sin uso (03 §10.2).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const paquete = dirname(fileURLToPath(import.meta.url));
const cli = join(
  dirname(createRequire(join(paquete, 'package.json')).resolve('prisma/package.json')),
  'build',
  'index.js',
);
const r = spawnSync(process.execPath, [cli, 'generate'], {
  cwd: paquete,
  stdio: 'inherit',
  env: { DIRECT_URL: 'postgresql://sin-uso@localhost/sin-uso', ...process.env },
});
process.exit(r.status ?? 1);
