// Controles negativos del lint (TA-003 los de fronteras; TA-005 los de las pruebas, 07 §7.1).
// Cada regla tiene un fixture que debe fallar y uno limpio que debe pasar.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { configurar } from '@finn/config/eslint';
import { verificar } from '../ci/verificar-dependencias.mjs';
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

// Controles de fronteras (TA-003, 04 §1.5). Cada archivo de controles/paquetes/ declara en su cabecera
// la ruta virtual donde "vive", la regla de ESLint y la regla de dependency-cruiser que debe marcarlo.
const carpeta = join(raiz, 'tools', 'lint', 'controles', 'paquetes');
const cabecera = (texto: string, clave: string): string =>
  new RegExp(`^// ${clave}: (.+)$`, 'm').exec(texto)?.[1]?.trim() ?? '';
const controles = readdirSync(carpeta)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => {
    const texto = readFileSync(join(carpeta, f), 'utf8');
    return {
      nombre: basename(f, '.ts'),
      ruta: cabecera(texto, 'ruta'),
      eslint: cabecera(texto, 'regla'),
      cruiser: cabecera(texto, 'depcruise'),
    };
  });

describe('controles de lint (fronteras de paquetes)', () => {
  it('hay un control por regla y todos declaran su cabecera', () => {
    expect(controles.length).toBeGreaterThanOrEqual(25);
    for (const c of controles) expect(c.ruta && c.eslint && c.cruiser, c.nombre).toBeTruthy();
  });

  it('(d) ESLint: cada control falla con su regla y los limpios no fallan', async () => {
    const eslint = new ESLint({
      cwd: raiz,
      overrideConfigFile: true,
      overrideConfig: configurar({ controles: true }),
    });
    const resultados = await eslint.lintFiles(['tools/lint/controles/paquetes/*.ts']);
    const reglas = new Map(
      resultados.map((r) => [basename(r.filePath, '.ts'), r.messages.map((m) => m.ruleId ?? '')]),
    );
    for (const c of controles) {
      const obtenidas = reglas.get(c.nombre) ?? [];
      if (c.eslint === 'ninguna') {
        const frontera = obtenidas.filter((r) => r.startsWith('finn/') || r.includes('restricted'));
        expect(frontera, `${c.nombre} no debe fallar por fronteras`).toEqual([]);
      } else {
        expect(obtenidas, `${c.nombre} debe fallar con ${c.eslint}`).toContain(c.eslint);
      }
    }
  });

  it('(c) dependency-cruiser: cada control falla con su regla', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'finn-depcruise-'));
    try {
      cpSync(join(raiz, '.dependency-cruiser.cjs'), join(tmp, '.dependency-cruiser.cjs'));
      for (const c of controles) {
        const destino = join(tmp, dirname(c.ruta), `${c.nombre}.ts`);
        mkdirSync(dirname(destino), { recursive: true });
        cpSync(join(carpeta, `${c.nombre}.ts`), destino);
      }
      const bin = join(raiz, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruiser.mjs');
      const args = [
        '--config',
        '.dependency-cruiser.cjs',
        '--output-type',
        'json',
        'apps',
        'packages',
      ];
      const salida = spawnSync(process.execPath, [bin, ...args], {
        cwd: tmp,
        encoding: 'utf8',
        maxBuffer: 1 << 26,
      });
      const { summary } = JSON.parse(salida.stdout) as {
        summary: { violations: { from: string; rule: { name: string } }[] };
      };
      for (const c of controles) {
        const marcadas = summary.violations
          .filter((v) => v.from.endsWith(`/${c.nombre}.ts`))
          .map((v) => v.rule.name);
        if (c.cruiser === 'ninguna') expect(marcadas, c.nombre).toEqual([]);
        else expect(marcadas, `${c.nombre} debe violar ${c.cruiser}`).toContain(c.cruiser);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('(a) verificar-dependencias: manifiestos y eslint-disable de frontera', () => {
    const web = { name: '@finn/web', dependencies: { '@finn/db': 'workspace:*' } };
    const casos: { paquete: string; manifiesto: object; fuente?: string; valido?: boolean }[] = [
      { paquete: 'apps/web', manifiesto: web },
      {
        paquete: 'packages/dominio',
        manifiesto: { name: '@finn/dominio', devDependencies: { '@finn/aplicacion': '1' } },
      },
      {
        paquete: 'packages/sms',
        manifiesto: { name: '@finn/sms', dependencies: { '@prisma/client': '7.0.0' } },
      },
      {
        paquete: 'packages/db',
        manifiesto: { name: '@finn/db', dependencies: { '@prisma/orm-client': '8.0.0' } },
      },
      {
        paquete: 'packages/aplicacion',
        manifiesto: { name: '@finn/aplicacion' },
        fuente:
          '// eslint-disable-next-line @typescript-eslint/no-restricted-imports\nexport {};\n',
      },
      {
        paquete: 'apps/web',
        manifiesto: {
          name: '@finn/web',
          dependencies: { '@finn/aplicacion': '1', '@finn/dominio': '1' },
        },
        valido: true,
      },
    ];
    for (const c of casos) {
      const tmp = mkdtempSync(join(tmpdir(), 'finn-manifiestos-'));
      try {
        writeFileSync(join(tmp, 'pnpm-workspace.yaml'), `packages:\n  - ${c.paquete}\n`);
        mkdirSync(join(tmp, c.paquete, 'src'), { recursive: true });
        writeFileSync(join(tmp, c.paquete, 'package.json'), JSON.stringify(c.manifiesto));
        if (c.fuente) writeFileSync(join(tmp, c.paquete, 'src', 'x.ts'), c.fuente);
        const fallos = verificar(tmp);
        if (c.valido) expect(fallos).toEqual([]);
        else expect(fallos.length, JSON.stringify(c.manifiesto)).toBeGreaterThan(0);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  });
});
