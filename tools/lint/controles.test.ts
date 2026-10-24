// Controles negativos del lint (TA-003 los de fronteras; TA-005 los de las pruebas, 07 §7.1).
// Cada regla tiene un fixture que debe fallar y uno limpio que debe pasar.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { pruebas } from '../../packages/config/eslint/pruebas.mjs';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const fixture = (nombre: string): string =>
  readFileSync(new URL(`./controles/pruebas/${nombre}.ts.txt`, import.meta.url), 'utf8');

async function reglas(codigo: string, rutaVirtual: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: raiz, overrideConfigFile: true, overrideConfig: pruebas });
  const [resultado] = await eslint.lintText(codigo, { filePath: rutaVirtual });
  return (resultado?.messages ?? []).map((m) => `${m.ruleId ?? 'parse'}:${m.message}`);
}

const E2E = 'apps/web/e2e/ejemplo.e2e.ts';

describe('lint de las pruebas (07 §7.1)', () => {
  it('prohíbe Date.now() en e2e/ y en *.test.ts', async () => {
    for (const ruta of [E2E, 'packages/dominio/src/x.test.ts']) {
      const m = await reglas(fixture('date-now'), ruta);
      expect(m.some((x) => x.startsWith('no-restricted-syntax:Date.now()'))).toBe(true);
    }
  });

  it('prohíbe new Date() sin argumentos, pero no con argumentos', async () => {
    const mal = await reglas(fixture('new-date'), E2E);
    expect(mal.some((x) => x.startsWith('no-restricted-syntax:new Date() sin'))).toBe(true);
    expect(await reglas('const t = new Date(0);\n', E2E)).toEqual([]);
  });

  it('prohíbe setTimeout con espera fija en e2e/', async () => {
    const mal = await reglas(fixture('set-timeout'), E2E);
    expect(mal.some((x) => x.startsWith('no-restricted-syntax:setTimeout'))).toBe(true);
  });

  it('no aplica la regla de setTimeout fuera de e2e/', async () => {
    expect(await reglas(fixture('set-timeout'), 'packages/dominio/src/x.test.ts')).toEqual([]);
  });

  it('aplica playwright/no-wait-for-timeout en e2e/', async () => {
    const mal = await reglas(fixture('wait-for-timeout'), E2E);
    expect(mal.some((x) => x.startsWith('playwright/no-wait-for-timeout'))).toBe(true);
  });

  it('deja pasar el código determinista', async () => {
    expect(await reglas(fixture('limpio'), E2E)).toEqual([]);
  });
});
