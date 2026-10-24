// Control negativo de versiones.mjs: debe pasar en un árbol coherente y fallar
// con un config.toml de otra versión mayor, un engines.node distinto o un Playwright distinto.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raizRepo = join(aqui, '..', '..', '..', '..');
const versiones = join(raizRepo, 'tools', 'pruebas', 'versiones.mjs');

function armar({ pg = '17', node = '24.x', lock = null }) {
  const d = mkdtempSync(join(tmpdir(), 'finn-versiones-'));
  mkdirSync(join(d, 'infra'));
  mkdirSync(join(d, 'supabase'));
  copyFileSync(join(raizRepo, 'infra', 'versiones.env'), join(d, 'infra', 'versiones.env'));
  writeFileSync(join(d, 'supabase', 'config.toml'), `[db]\nport = 54322\nmajor_version = ${pg}\n`);
  writeFileSync(join(d, 'package.json'), JSON.stringify({ engines: { node } }));
  if (lock) writeFileSync(join(d, 'pnpm-lock.yaml'), lock);
  return d;
}

function correr(opciones) {
  const d = armar(opciones);
  try {
    return spawnSync(process.execPath, [versiones, d], { encoding: 'utf8' }).status;
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}

const casos = [
  ['coherente pasa', {}, 0],
  ['config.toml con otra versión mayor falla', { pg: '16' }, 1],
  ['engines.node distinto falla', { node: '22.x' }, 1],
  ['@playwright/test distinto en el lockfile falla', { lock: "'@playwright/test@1.55.0':\n" }, 1],
  ['@playwright/test 1.56.x en el lockfile pasa', { lock: "'@playwright/test@1.56.1':\n" }, 0],
];
let fallos = 0;
for (const [nombre, opciones, esperado] of casos) {
  const real = correr(opciones);
  const ok = real === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} ${nombre} (salida ${real}, esperada ${esperado})`);
}
process.exit(fallos === 0 ? 0 : 1);
