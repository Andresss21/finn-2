// `pnpm probar` (TA-597): la app en local contra la pila de la E2E, con la semilla de A.7, para probar cambios en el navegador.
//   pnpm probar                 candado de la E2E, pila, siembra, `next build` y `next start` en :3100, como la E2E
//   pnpm probar --sin-compilar  reutiliza la última compilación (si no cambió el código)
//   pnpm probar --bajar         detiene la app de otra terminal, baja la pila y suelta el candado
//   pnpm probar:codigo          el código TOTP vigente del usuario de prueba
// Por qué no `next dev`: ver `leerOpciones` (tools/pruebas/e2e/local.ts).
// Reutiliza lo de `pnpm test:e2e`: la pila (pila.ts), el usuario con TOTP (usuario.ts), el reloj (reloj.ts) y la siembra
// por operaciones reales (semilla.ts). El entorno queda en el directorio temporal del sistema, nunca en el repo.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as esperar } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { codigoDe } from '../../apps/web/e2e/ayudas/totp.ts';
import { rutaCandado, tomarCandado } from '../pruebas/e2e/candado.ts';
import {
  AVISO_CANDADO,
  borrarEstado,
  detenerArbol,
  entornoServidor,
  guardarEstado,
  leerEstado,
  leerOpciones,
  PUERTO_LOCAL,
  textoAcceso,
} from '../pruebas/e2e/local.ts';
import { bajarPila, levantarPila } from '../pruebas/e2e/pila.ts';
import { ARCHIVO_RELOJ, borrarRelojServidor } from '../pruebas/e2e/reloj.ts';

const aqui = dirname(fileURLToPath(import.meta.url));
const web = join(aqui, '..', '..', 'apps', 'web');
const shell = process.platform === 'win32';
const inicio = performance.now();
const segundos = () => `${Math.round((performance.now() - inicio) / 1000)} s`;

const opciones = leerOpciones(process.argv.slice(2));

if (opciones.bajar) {
  const previo = leerEstado();
  if (previo && previo.pid !== process.pid) detenerArbol(previo.pid);
  bajarPila();
  borrarEstado();
  borrarRelojServidor();
  // El candado es del proceso que se acaba de detener (o de uno ya muerto); el de otro agente no se toca.
  const candado = rutaCandado();
  if (existsSync(candado) && previo) {
    const dueno = JSON.parse(readFileSync(candado, 'utf8'));
    if (dueno.pid === previo.pid) rmSync(candado, { force: true });
  }
  console.log('probar: app detenida, pila abajo y candado suelto');
  process.exit(0);
}

console.log(AVISO_CANDADO);
const soltar = await tomarCandado({
  alEsperar: (d) => console.log(`probar: ${rutaCandado()} lo tiene ${d.pid} (otra E2E); esperando`),
});
let servidor;
let cerrando = false;
function cerrar(codigo) {
  if (cerrando) return;
  cerrando = true;
  console.log('probar: bajando la app y la pila');
  if (servidor?.pid) detenerArbol(servidor.pid);
  bajarPila();
  borrarEstado();
  borrarRelojServidor();
  soltar();
  process.exit(codigo);
}
for (const senal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(senal, () => cerrar(130));

function correr(comando, args, env) {
  const r = spawnSync(comando, args, { cwd: web, stdio: 'inherit', shell, env });
  if (r.status !== 0) throw new Error(`probar: falló ${comando} ${args.join(' ')}`);
}

/** 07 §7.1: se espera a que responda, con tiempo máximo, no un tiempo fijo. */
async function esperarServidor() {
  for (let i = 0; i < 600; i++) {
    if (servidor.exitCode !== null) throw new Error('probar: el servidor terminó al arrancar');
    const r = await globalThis.fetch(`http://localhost:${PUERTO_LOCAL}/ingresar`).catch(() => null);
    if (r?.ok) return;
    await esperar(500);
  }
  throw new Error(`probar: http://localhost:${PUERTO_LOCAL}/ingresar no respondió a tiempo`);
}

try {
  console.log('probar: levantando la pila local');
  const entorno = entornoServidor(await levantarPila(), ARCHIVO_RELOJ);
  borrarRelojServidor();
  guardarEstado({ pid: process.pid, entorno });
  console.log(`probar: pila arriba (${segundos()}); sembrando A.7`);
  // `sembrar` es TypeScript con importaciones sin extensión: Playwright lo carga, como en la E2E. No abre navegador.
  correr('pnpm', ['exec', 'playwright', 'test', '--config', join(aqui, 'playwright.config.ts')], {
    ...process.env,
  });
  const env = { ...process.env, ...entorno };
  if (opciones.compilar) {
    console.log(`probar: sembrado (${segundos()}); compilando`);
    correr('node', ['../../tools/pruebas/e2e/compilar.mjs'], env);
  }
  console.log(`probar: (${segundos()}) arrancando next start`);
  servidor = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PUERTO_LOCAL)], {
    cwd: web,
    stdio: 'inherit',
    shell,
    env,
  });
  servidor.on('exit', (c) => cerrar(c ?? 1));
  await esperarServidor();
  console.log(`probar: arriba en ${segundos()}`);
  console.log(textoAcceso(entorno, codigoDe(entorno.E2E_TOTP_SECRETO)));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  cerrar(1);
}
