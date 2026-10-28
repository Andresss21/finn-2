// PRU-ESQ-POOL-001 (07 §19.5, CT-06, P7-21): la prueba estática que acompaña a la marca local del bloqueo.
// `tools/lint/bloqueos-sesion.mjs` rechaza en `packages/db/src` y `packages/aplicacion/src` los bloqueos
// asesores de sesión, un `SET` sin `LOCAL` y la marca `finn.bloqueo_xact` puesta a mano. Cada control de
// `tools/lint/controles/bloqueos-sesion/` declara en su cabecera la regla que debe marcarlo.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const lint = join(raiz, 'tools', 'lint', 'bloqueos-sesion.mjs');
const carpeta = join(raiz, 'tools', 'lint', 'controles', 'bloqueos-sesion');
const controles = readdirSync(carpeta)
  .filter((f) => f.endsWith('.ts.txt'))
  .map((f) => {
    const texto = readFileSync(join(carpeta, f), 'utf8');
    return { nombre: f, texto, regla: /^\/\/ regla: (\S+)$/m.exec(texto)?.[1] ?? '' };
  });

/** Corre el lint sobre un árbol temporal con `archivos` (ruta relativa → contenido). */
function correr(archivos: Record<string, string>): { codigo: number | null; texto: string } {
  const dir = mkdtempSync(join(tmpdir(), 'finn-bloqueos-'));
  try {
    for (const [ruta, contenido] of Object.entries(archivos)) {
      mkdirSync(join(dir, ruta, '..'), { recursive: true });
      writeFileSync(join(dir, ruta), contenido);
    }
    const r = spawnSync(process.execPath, [lint, dir], { encoding: 'utf8' });
    return { codigo: r.status, texto: r.stdout + r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('PRU-ESQ-POOL', () => {
  it('PRU-ESQ-POOL-001 CT-06, MIG-14 (P7-21): el lint de bloqueos de sesión pasa en el repositorio, cada control con un patrón prohibido lo hace fallar con su regla y las migraciones quedan fuera', () => {
    const repo = spawnSync(process.execPath, [lint], { cwd: raiz, encoding: 'utf8' });
    expect(repo.stdout + repo.stderr).toContain('bloqueos-sesion: sin bloqueos de sesión');
    expect(repo.status).toBe(0);

    const reglas = controles.map((c) => c.regla).sort();
    expect(reglas).toEqual([
      'advisory-lock',
      'marca-a-mano',
      'ninguna',
      'set-sin-local',
      'try-advisory-lock',
    ]);
    // Cada control falla en los dos paquetes, solo con su regla
    for (const c of controles.filter((x) => x.regla !== 'ninguna'))
      for (const paquete of ['db', 'aplicacion']) {
        const r = correr({
          [`packages/${paquete}/src/sub/${c.nombre.replace('.txt', '')}`]: c.texto,
        });
        expect(r.codigo, `${c.nombre} en ${paquete}`).toBe(1);
        const marcadas = [...r.texto.matchAll(/^\[([a-z-]+)\]/gm)].map((m) => m[1]);
        expect(marcadas, `${c.nombre} en ${paquete}`).toEqual([c.regla]);
        expect(r.texto).toContain(`packages/${paquete}/src/sub/`);
      }
    // El control limpio pasa: bloqueo de la transacción, ajustes locales y el SET de un UPDATE
    const limpio = controles.find((c) => c.regla === 'ninguna')?.texto ?? '';
    expect(correr({ 'packages/db/src/limpio.ts': limpio }).codigo).toBe(0);
    // Las migraciones ponen la marca y quedan fuera, igual que cualquier ruta fuera de los dos `src`
    const todos = controles.map((c) => c.texto).join('\n');
    const fuera = correr({
      'packages/db/prisma/migrations/20990101000000_m_x/migration.sql': todos,
      'packages/db/test/x.int.test.ts': todos,
      'packages/web/src/x.ts': todos,
    });
    expect(fuera.codigo).toBe(0);
  });
});
