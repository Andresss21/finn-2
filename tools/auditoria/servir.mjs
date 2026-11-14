// Auditoría de diseño: deja la app corriendo en local para capturar muchas veces sin recompilar.
//   node tools/auditoria/servir.mjs          toma el candado de la E2E, levanta la pila, compila y sirve en :3100
//   node tools/auditoria/servir.mjs --bajar  baja la pila (si el proceso anterior quedó cortado)
// Reutiliza lo de `pnpm test:e2e` (tools/pruebas/e2e): la misma pila, el mismo usuario de prueba con TOTP y el mismo reloj.
// El entorno (claves de la pila efímera local) queda en el directorio temporal del sistema, nunca en el repo.
import { spawn, spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rutaCandado, tomarCandado } from '../pruebas/e2e/candado.ts';
import { bajarPila, levantarPila } from '../pruebas/e2e/pila.ts';
import { entornoServidor } from '../pruebas/e2e/local.ts';
import { ARCHIVO_RELOJ, borrarRelojServidor } from '../pruebas/e2e/reloj.ts';

export const ARCHIVO_ENTORNO = join(tmpdir(), 'finn-auditoria-entorno.json');
const web = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'web');
const PUERTO = 3100;

if (process.argv.includes('--bajar')) {
  bajarPila();
  rmSync(ARCHIVO_ENTORNO, { force: true });
  console.log('auditoría: pila abajo');
  process.exit(0);
}

const soltar = await tomarCandado({
  alEsperar: (d) => console.log(`auditoría: ${rutaCandado()} lo tiene ${d.pid}; esperando`),
});
let servidor;
const cerrar = (codigo) => {
  servidor?.kill();
  bajarPila();
  rmSync(ARCHIVO_ENTORNO, { force: true });
  soltar();
  process.exit(codigo);
};
for (const senal of ['SIGINT', 'SIGTERM']) process.on(senal, () => cerrar(130));

try {
  console.log('auditoría: levantando la pila local');
  const entorno = entornoServidor(await levantarPila(), ARCHIVO_RELOJ);
  borrarRelojServidor();
  writeFileSync(ARCHIVO_ENTORNO, JSON.stringify(entorno));
  const env = { ...process.env, ...entorno };
  const shell = process.platform === 'win32';
  if (!process.argv.includes('--sin-compilar')) {
    console.log('auditoría: compilando');
    const c = spawnSync('node', ['../../tools/pruebas/e2e/compilar.mjs'], {
      cwd: web,
      stdio: 'inherit',
      env,
    });
    if (c.status !== 0) throw new Error('la compilación falló');
  }
  servidor = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PUERTO)], {
    cwd: web,
    stdio: 'inherit',
    shell,
    env,
  });
  servidor.on('exit', (c) => cerrar(c ?? 1));
  console.log(`auditoría: LISTO en http://localhost:${PUERTO}`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  cerrar(1);
}
