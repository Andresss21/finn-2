// Candado de la E2E local (TA-219, DT-22): lo que choca son los puertos fijos de la pila (P8-5), así que `pnpm test:e2e`
// lo toma antes de levantarla y lo suelta al terminar. Si otro agente lo tiene, espera e informa una vez.
// Un candado cuyo dueño ya no existe (proceso cortado) se reemplaza. Solo lo disputan agentes de la misma máquina.
import { closeSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as esperar } from 'node:timers/promises';

export type DuenoCandado = { pid: number; desde: string };
export type OpcionesCandado = {
  ruta?: string;
  alEsperar?: (dueno: DuenoCandado) => void;
  intervaloMs?: number;
  maximoMs?: number;
};

/** `C:/finn/e2e.lock` en la PC (DT-22); en Linux no hay `C:/finn` y en CI corre un solo job por runner. */
export const rutaCandado = (): string =>
  process.env['FINN_E2E_CANDADO'] ??
  (process.platform === 'win32' ? 'C:/finn/e2e.lock' : join(tmpdir(), 'finn-e2e.lock'));

const vivo = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM'; // existe, de otro usuario
  }
};

function leerDueno(ruta: string): DuenoCandado | null {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8')) as DuenoCandado;
  } catch {
    return null; // lo soltaron, o el otro todavía no terminó de escribirlo
  }
}

/** `wx` es atómico: de dos corridas simultáneas, una sola crea el archivo. */
function crear(ruta: string, dueno: DuenoCandado): boolean {
  try {
    const fd = openSync(ruta, 'wx');
    writeSync(fd, JSON.stringify(dueno));
    closeSync(fd);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw e;
  }
}

/** Espera su turno y devuelve la función que suelta el candado. Soltarlo dos veces no hace nada. */
export async function tomarCandado(op: OpcionesCandado = {}): Promise<() => void> {
  const { ruta = rutaCandado(), alEsperar, intervaloMs = 2_000, maximoMs = 3_600_000 } = op;
  const yo: DuenoCandado = { pid: process.pid, desde: new Date().toISOString() };
  const inicio = performance.now();
  let avisado = false;
  while (!crear(ruta, yo)) {
    const dueno = leerDueno(ruta);
    if (dueno && !vivo(dueno.pid)) {
      rmSync(ruta, { force: true });
      continue;
    }
    if (dueno && !avisado) {
      avisado = true;
      alEsperar?.(dueno);
    }
    if (performance.now() - inicio >= maximoMs)
      throw new Error(`el candado de la E2E (${ruta}) sigue ocupado tras ${maximoMs} ms`);
    await esperar(intervaloMs);
  }
  let suelto = false;
  return () => {
    if (!suelto) rmSync(ruta, { force: true });
    suelto = true;
  };
}
