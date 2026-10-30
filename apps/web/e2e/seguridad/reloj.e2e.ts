// PRU-SEG-RELOJ-001 (V7-07; 07 §4.3, barrera 1; CT-01, P7-10): `next start` con cada uno de los 11 casos, portados
// del prototipo verificado (docs/anexos/07-pruebas-verificacion/…/web/seg/barreras.mjs). No abre el navegador: arranca
// procesos propios sobre la compilación que dejó el `webServer` de Playwright. Espera eventos del proceso, nunca un
// tiempo fijo (07 §7.1). `next start` escribe «Ready» antes de correr `register()`, pero retiene las peticiones hasta
// terminarlo: una respuesta prueba que pasó la barrera, y la salida que corta la conexión, que no la pasó.
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  ARCHIVO_RELOJ,
  borrarRelojServidor,
  fijarRelojServidor,
} from '../../../../tools/pruebas/e2e/reloj.ts';

const WEB = fileURLToPath(new URL('../../', import.meta.url));
const NEXT = createRequire(import.meta.url).resolve('next/dist/bin/next');
const PUERTO = 3101; // El 3100 es del webServer; la E2E corre con un solo trabajador y bajo candado (DT-22)
const RUTA = `http://localhost:${PUERTO}/api/pruebas/reloj`;

type Esperado = 'no-arranca' | 'reloj-prueba' | 'reloj-real';
const A = ARCHIVO_RELOJ;
const CASOS: readonly [string, Record<string, string>, Esperado][] = [
  [
    'control positivo: FINN_ENTORNO=pruebas, sin VERCEL_ENV',
    { FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: A },
    'reloj-prueba',
  ],
  [
    'VERCEL_ENV=production',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'production', FINN_RELOJ_ARCHIVO: A },
    'no-arranca',
  ],
  [
    'VERCEL_ENV=preview',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: A },
    'no-arranca',
  ],
  [
    'VERCEL_ENV=development',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'development', FINN_RELOJ_ARCHIVO: A },
    'no-arranca',
  ],
  [
    'VERCEL_ENV vacía',
    { FINN_ENTORNO: 'pruebas', VERCEL_ENV: '', FINN_RELOJ_ARCHIVO: A },
    'no-arranca',
  ],
  ['sin FINN_ENTORNO', { FINN_RELOJ_ARCHIVO: A }, 'no-arranca'],
  ['FINN_ENTORNO=produccion', { FINN_ENTORNO: 'produccion', FINN_RELOJ_ARCHIVO: A }, 'no-arranca'],
  [
    'FINN_ENTORNO=Pruebas (mayúscula)',
    { FINN_ENTORNO: 'Pruebas', FINN_RELOJ_ARCHIVO: A },
    'no-arranca',
  ],
  ['solo FINN_HOY_SIMULADO, sin FINN_ENTORNO', { FINN_HOY_SIMULADO: '2027-02-20' }, 'no-arranca'],
  [
    'FINN_RELOJ_ARCHIVO vacía, VERCEL_ENV=preview',
    { VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: '' },
    'no-arranca',
  ],
  ['control: VERCEL_ENV=preview sin variables de reloj', { VERCEL_ENV: 'preview' }, 'reloj-real'],
];

// Cada caso define solo lo suyo: lo que el proceso de Playwright traiga de estas cuatro no debe decidir el resultado
// (`spawn` omite las variables con valor `undefined`).
const ENTORNO_LIMPIO: NodeJS.ProcessEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  FINN_ENTORNO: undefined,
  VERCEL_ENV: undefined,
  FINN_RELOJ_ARCHIVO: undefined,
  FINN_HOY_SIMULADO: undefined,
};

/** Qué dice el servidor ya listo: la ruta de prueba responde con el archivo, o 404 si el reloj no está permitido. */
async function relojDelServidor(): Promise<string> {
  const r = await fetch(RUTA);
  if (r.status === 404) return 'reloj-real';
  const { hoy } = (await r.json()) as { hoy: string | null };
  return hoy === '2027-02-20' ? 'reloj-prueba' : `reloj inesperado: ${String(hoy)}`;
}

let enCurso: ChildProcess | undefined; // Si la prueba vence a mitad de un caso, no queda un servidor huérfano

/** El resultado del caso. Una salida 1 solo cuenta si trae el motivo: la de cualquier otro fallo no es la barrera. */
async function correrCaso(extra: Record<string, string>): Promise<string> {
  const proceso = spawn(process.execPath, [NEXT, 'start', '-p', String(PUERTO)], {
    cwd: WEB,
    env: { ...ENTORNO_LIMPIO, ...extra },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  enCurso = proceso;
  let errores = '';
  proceso.stderr.on('data', (d: Buffer) => (errores += d.toString()));
  const cerrado = new Promise<number | null>((resolver) => proceso.once('close', resolver));
  const listo = new Promise<'listo'>((resolver) => {
    proceso.stdout.on('data', (d: Buffer) => {
      if (d.toString().includes('Ready')) resolver('listo');
    });
  });
  try {
    // Si la conexión se corta es porque el proceso está saliendo: decide su código de salida.
    const consulta = listo.then(relojDelServidor).catch(() => cerrado);
    const primero = await Promise.race([cerrado, consulta]);
    if (typeof primero === 'string') return primero;
    const conMotivo = primero === 1 && errores.includes('finn: reloj de prueba');
    return conMotivo ? 'no-arranca' : `salió con ${String(primero)}: ${errores}`;
  } finally {
    proceso.kill();
    await cerrado; // El caso siguiente usa el mismo puerto
  }
}

test.describe('PRU-SEG-RELOJ', () => {
  test.describe.configure({ timeout: 300_000 }); // Once arranques de `next start`, uno tras otro

  test.afterAll(() => {
    enCurso?.kill();
    borrarRelojServidor();
  });

  test('PRU-SEG-RELOJ-001 CT-01, CT-01-barrera1: next start sale con 1 y registra el motivo en los 9 casos prohibidos de 07 §4.3, y arranca en los 2 controles', async () => {
    expect(CASOS).toHaveLength(11);
    expect(CASOS.filter(([, , e]) => e === 'no-arranca')).toHaveLength(9);
    fijarRelojServidor('2027-02-20T12:00:00-06:00'); // El archivo existe en todos los casos

    const obtenidos: [string, string][] = [];
    for (const [nombre, extra] of CASOS) obtenidos.push([nombre, await correrCaso(extra)]);

    expect(obtenidos).toEqual(CASOS.map(([nombre, , esperado]) => [nombre, esperado]));
  });
});
