// Control del candado de la E2E local (TA-219, DT-22): con dos corridas simultáneas, la segunda espera.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { tomarCandado, type DuenoCandado } from './candado.ts';

let dir: string;
let ruta: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'finn-candado-'));
  ruta = join(dir, 'e2e.lock');
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const modulo = pathToFileURL(join(import.meta.dirname, 'candado.ts')).href;
const duenoActual = () => (JSON.parse(readFileSync(ruta, 'utf8')) as DuenoCandado).pid;

/** Otra corrida, en otro proceso: toma el candado, avisa por stdout y lo suelta cuando se cierra su stdin. */
function otraCorrida(): Promise<{ soltar: () => Promise<void>; pid: number | undefined }> {
  const codigo = `import { tomarCandado } from ${JSON.stringify(modulo)};
    const soltar = await tomarCandado({ ruta: ${JSON.stringify(ruta)} });
    console.log('tomado');
    process.stdin.resume();
    process.stdin.on('end', () => { soltar(); process.exit(0); });`;
  const hijo = spawn(process.execPath, ['--input-type=module', '-e', codigo], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const fin = new Promise<void>((r) => {
    hijo.on('exit', () => {
      r();
    });
  });
  return new Promise((listo) => {
    hijo.stdout.once('data', () => {
      listo({
        pid: hijo.pid,
        soltar: () => {
          hijo.stdin.end();
          return fin;
        },
      });
    });
  });
}

describe('candado de la E2E local (DT-22)', () => {
  it('candado: dos corridas simultáneas; la segunda espera, informa quién lo tiene y sigue cuando la primera suelta', async () => {
    const primera = await otraCorrida();
    const eventos: string[] = [];
    let avisar: (d: DuenoCandado) => void = () => undefined;
    const dueno = new Promise<DuenoCandado>((r) => {
      avisar = r;
    });
    const segunda = tomarCandado({
      ruta,
      intervaloMs: 5,
      alEsperar: (d) => {
        eventos.push('espera');
        avisar(d);
      },
    }).then((soltar) => {
      eventos.push('tomado');
      return soltar;
    });

    expect((await dueno).pid).toBe(primera.pid);
    expect(eventos).toEqual(['espera']); // sigue esperando: la primera no soltó

    await primera.soltar();
    const soltar = await segunda;
    expect(eventos).toEqual(['espera', 'tomado']);
    expect(duenoActual()).toBe(process.pid);
    soltar();
    expect(existsSync(ruta)).toBe(false);
  });

  it('candado: uno de un proceso que ya murió no bloquea', async () => {
    const { pid } = spawnSync(process.execPath, ['-e', '']);
    writeFileSync(ruta, JSON.stringify({ pid, desde: 'muerto' }));
    const esperas: DuenoCandado[] = [];
    const soltar = await tomarCandado({ ruta, alEsperar: (d) => esperas.push(d) });
    expect(esperas).toEqual([]);
    soltar();
  });

  it('candado: vencido el tiempo máximo, falla en vez de esperar para siempre y no toca el ajeno', async () => {
    const primera = await otraCorrida();
    await expect(tomarCandado({ ruta, intervaloMs: 1, maximoMs: 0 })).rejects.toThrow(
      /candado de la E2E/,
    );
    expect(duenoActual()).toBe(primera.pid);
    await primera.soltar();
  });
});
