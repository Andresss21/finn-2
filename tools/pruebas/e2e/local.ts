// La app en local contra la pila de la E2E (TA-597): lo que comparten `pnpm probar` (tools/probar) y la auditoría de
// diseño (tools/auditoria/servir.mjs). La pila la levanta `levantarPila` (pila.ts); aquí solo el entorno del servidor,
// el archivo temporal donde queda y el texto para entrar. Nada de esto se usa fuera de la PC ni de CI.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SECRETO_RESPALDO_E2E } from './respaldo.ts';

// El de apps/web/e2e/ayudas/tarea-diaria.ts (ese módulo importa Playwright; aquí solo hace falta el valor de prueba)
export const SECRETO_TAREA_E2E = 'secreto-local-de-la-e2e-solo-para-pruebas-0000';
export const PUERTO_LOCAL = 3100;

/** Solo del servidor (como en apps/web/playwright.config.ts): el proceso que siembra no debe verse en modo de pruebas. */
export const SOLO_SERVIDOR = [
  'FINN_ENTORNO',
  'FINN_RELOJ_ARCHIVO',
  'CRON_SECRET',
  'RESPALDO_SECRET',
] as const;

/** Lo que `next start` necesita además de lo que devuelve `levantarPila`. */
export function entornoServidor(
  pila: Readonly<Record<string, string>>,
  archivoReloj: string,
): Record<string, string> {
  return {
    ...pila,
    FINN_ENTORNO: 'pruebas',
    FINN_RELOJ_ARCHIVO: archivoReloj,
    CRON_SECRET: SECRETO_TAREA_E2E,
    RESPALDO_SECRET: SECRETO_RESPALDO_E2E,
    NEXT_TELEMETRY_DISABLED: '1',
  };
}

/** El entorno del proceso que siembra: el del servidor sin las variables que son solo suyas. */
export function sinSoloServidor(
  entorno: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined> {
  const solo: readonly string[] = SOLO_SERVIDOR;
  return Object.fromEntries(Object.entries(entorno).filter(([k]) => !solo.includes(k)));
}

// Solo la compilación de producción, como la E2E (05 §14.1). `next dev` (16.4.1) no sirve: su validación estricta de
// rutas deja /ingresar, /ingresar/verificar, /ingresar/inscribir y /sin-conexion en 404 por la ranura paralela
// `(finn)/@superpuesto`, y sin /ingresar no se puede entrar. `next build` no hace esa validación.
export type OpcionesProbar = { bajar: boolean; compilar: boolean };

export function leerOpciones(argv: readonly string[]): OpcionesProbar {
  const conocidas = new Set(['--bajar', '--sin-compilar']);
  const otra = argv.find((a) => !conocidas.has(a));
  if (otra !== undefined)
    throw new Error(`probar: opción desconocida ${otra} (usa --sin-compilar o --bajar)`);
  return { bajar: argv.includes('--bajar'), compilar: !argv.includes('--sin-compilar') };
}

/** Lo que queda en el directorio temporal mientras la app corre: nunca en el repositorio. */
export type EstadoProbar = { pid: number; entorno: Record<string, string> };

export const archivoProbar = (dir = tmpdir()): string => join(dir, 'finn-probar-entorno.json');

export function guardarEstado(estado: EstadoProbar, ruta = archivoProbar()): void {
  writeFileSync(ruta, JSON.stringify(estado));
}

export function leerEstado(ruta = archivoProbar()): EstadoProbar | null {
  if (!existsSync(ruta)) return null;
  return JSON.parse(readFileSync(ruta, 'utf8')) as EstadoProbar;
}

export function borrarEstado(ruta = archivoProbar()): void {
  rmSync(ruta, { force: true });
}

export const AVISO_CANDADO =
  'probar: mientras la app esté arriba tenés el candado de la E2E local (DT-22): `pnpm test:e2e` de los agentes ' +
  'espera hasta que la bajes con Ctrl+C o con `pnpm probar --bajar`.';

/** Lo que el usuario necesita para entrar por la pantalla real de FT-01 (no hay atajo de sesión). */
export function textoAcceso(
  entorno: Readonly<Record<string, string>>,
  codigo: string,
  puerto = PUERTO_LOCAL,
): string {
  return [
    `probar: LISTO en http://localhost:${puerto}`,
    `  correo:  ${entorno['E2E_EMAIL'] ?? '(falta E2E_EMAIL)'}`,
    `  clave:   ${entorno['E2E_CLAVE'] ?? '(falta E2E_CLAVE)'}`,
    `  código:  ${codigo}   (cambia cada 30 s; uno nuevo con \`pnpm probar:codigo\`)`,
    '  Son de esta pila local y de esta corrida: no existen en ningún otro lado.',
    '  Para bajar: Ctrl+C aquí, o `pnpm probar --bajar` desde otra terminal.',
  ].join('\n');
}

/** Detiene un proceso con sus hijos: en Windows `kill` sobre el `cmd` de `shell: true` deja vivo a `next`. */
export function detenerArbol(pid: number): void {
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // ya no existe
      }
    }
}
