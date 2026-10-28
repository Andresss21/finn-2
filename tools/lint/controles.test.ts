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
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import { beforeAll, describe, expect, it } from 'vitest';
import { configurar } from '@finn/config/eslint';
import { verificar } from '../ci/verificar-dependencias.mjs';
import { LISTA_CERRADA, verificarLecturas } from '../ci/lecturas-interactivas.mjs';
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

  // Plazo propio, mismo criterio que bb312c2 (#33): en el run 40355731276 de ci.yml en main
  // (runner de GitHub, cobertura v8) tardó 5393 ms y pasó los 5 s por defecto. Mismos casos.
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
  }, 60_000);

  it('(c) dependency-cruiser: cada control falla con su regla', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'finn-depcruise-'));
    try {
      cpSync(join(raiz, '.dependency-cruiser.cjs'), join(tmp, '.dependency-cruiser.cjs'));
      // CH-28: el espacio de trabajo mínimo para que depcruise resuelva @finn/dominio como lo hace en el repositorio
      // (si no, no distingue `import type` de un import de valor)
      writeFileSync(
        join(tmp, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' } }),
      );
      mkdirSync(join(tmp, 'packages', 'dominio', 'src'), { recursive: true });
      writeFileSync(
        join(tmp, 'packages', 'dominio', 'package.json'),
        JSON.stringify({ name: '@finn/dominio', exports: { '.': './src/index.ts' } }),
      );
      writeFileSync(
        join(tmp, 'packages', 'dominio', 'src', 'index.ts'),
        'export const calcular = 0;\nexport type Hechos = object;\n',
      );
      mkdirSync(join(tmp, 'node_modules', '@finn'), { recursive: true });
      symlinkSync(
        join(tmp, 'packages', 'dominio'),
        join(tmp, 'node_modules', '@finn', 'dominio'),
        'junction',
      );
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

// Controles del cliente (TA-004, 05 §1.7). Cada archivo de controles/web/ declara la ruta donde "vive" y la
// regla que debe marcarlo; se lintea con esa ruta virtual, porque las reglas apuntan a las carpetas de 05 §1.1.
const carpetaWeb = join(raiz, 'tools', 'lint', 'controles', 'web');
const controlesWeb = readdirSync(carpetaWeb)
  .filter((f) => /^L\d\d-.*\.(tsx?|css)$/.test(f))
  .map((f) => {
    const texto = readFileSync(join(carpetaWeb, f), 'utf8');
    const clave = (k: string): string =>
      new RegExp(`^(?:// |\\s*)${k}: (.+?)(?: \\*/)?$`, 'm').exec(texto)?.[1]?.trim() ?? '';
    return {
      archivo: f,
      regla: /^L\d\d/.exec(f)?.[0] ?? '',
      ruta: clave('ruta'),
      id: clave('regla'),
      texto,
    };
  });

// Rutas virtuales de las pruebas de "lo permitido": van al proyecto por defecto junto con las de los controles.
const LIMPIOS: [string, string][] = [
  [
    'apps/web/src/formularios/f.ts',
    "import { centavos } from '@finn/dominio/valores';\nexport const c = centavos;\n",
  ],
  [
    'apps/web/src/componentes/dominio/f.ts',
    "import type { Centavos } from '@finn/dominio/valores';\nexport type T = Centavos;\n",
  ],
  [
    'apps/web/src/componentes/navegacion/enlace-finn.tsx',
    "import Link from 'next/link';\nexport const E = Link;\n",
  ],
  [
    'apps/web/src/componentes/base/b.tsx',
    "import * as D from '@radix-ui/react-dialog';\nexport const B = D;\n",
  ],
  [
    'apps/web/src/formato/m.ts',
    "export const f = new Intl.NumberFormat('es-CL');\nexport const h = (d: Date): string => d.toLocaleString();\n",
  ],
  [
    'apps/web/src/cliente/almacen.ts',
    "export const l = (): string | null => sessionStorage.getItem('k');\n",
  ],
  ['apps/web/src/cliente/reloj.ts', 'export const a = (): number => new Date(0).getTime();\n'],
  ['apps/web/src/textos/t.tsx', 'export const T = () => <p>Hola</p>;\n'],
  [
    'apps/web/src/componentes/dominio/ok.tsx',
    'import * as z from \'zod\';\nexport const Ok = ({ s }: { s: string }) => <p className="text-texto bg-superficie p-4">{s}{z.string().length}</p>;\n',
  ],
  [
    'apps/web/src/componentes/dominio/off.tsx',
    'export const Off = () => <button disabled className="text-texto-deshabilitado">{null}</button>;\n',
  ],
];

// Una sola corrida de ESLint en un proceso aparte para todas las rutas virtuales (tools/lint/controles/lintar-virtual.mjs).
const resultadosWeb = new Map<string, string[]>();
beforeAll(() => {
  const items = [
    ...controlesWeb
      .filter((c) => /\.tsx?$/.test(c.archivo))
      .map((c) => ({ ruta: c.ruta, codigo: c.texto })),
    ...LIMPIOS.map(([ruta, codigo]) => ({ ruta, codigo })),
  ];
  const salida = spawnSync(
    process.execPath,
    [join(raiz, 'tools', 'lint', 'controles', 'lintar-virtual.mjs')],
    {
      cwd: raiz,
      input: JSON.stringify(items),
      encoding: 'utf8',
      maxBuffer: 1 << 26,
    },
  );
  if (salida.status !== 0) throw new Error(salida.stderr);
  for (const [ruta, reglas] of Object.entries(
    JSON.parse(salida.stdout) as Record<string, string[]>,
  ))
    resultadosWeb.set(ruta, reglas);
}, 120_000);
const lintarWeb = (ruta: string): string[] => resultadosWeb.get(ruta) ?? [];

const configStylelint = join(raiz, 'stylelint.config.mjs');
async function reglasCss(codigo: string, ruta: string): Promise<string[]> {
  const r = await stylelint.lint({
    code: codigo,
    codeFilename: join(raiz, ruta),
    configFile: configStylelint,
  });
  return (r.results[0]?.warnings ?? []).map((w) => w.rule);
}

describe('controles de lint (cliente L1 a L19)', () => {
  it('hay un control por cada regla de L1 a L19', () => {
    const cubiertas = new Set(controlesWeb.map((c) => c.regla));
    for (let n = 1; n <= 19; n++)
      expect(cubiertas, `L${n}`).toContain(`L${String(n).padStart(2, '0')}`);
    for (const c of controlesWeb) expect(c.ruta && c.id, c.archivo).toBeTruthy();
  });

  it(
    'PRU-DOM-VAL-006 [L1 y L3: ESLint sobre el archivo de control falla con esas reglas (V5-12)]',
    { timeout: 120_000 },
    () => {
      const l1 = controlesWeb.find((c) => c.regla === 'L01');
      const l3 = controlesWeb.find((c) => c.regla === 'L03');
      expect(lintarWeb(l1?.ruta ?? '')).toContain('@typescript-eslint/no-restricted-imports');
      expect(lintarWeb(l3?.ruta ?? '')).toContain('finn/centavos');
    },
  );

  it('cada control de ESLint falla con su regla', () => {
    for (const c of controlesWeb.filter((x) => /\.tsx?$/.test(x.archivo) && x.regla !== 'L10')) {
      expect(lintarWeb(c.ruta), `${c.archivo} debe fallar con ${c.id}`).toContain(c.id);
    }
  });

  it('L10: una exportación fuera de la lista cerrada o un use server fuera de lugar fallan', () => {
    const c = controlesWeb.find((x) => x.regla === 'L10');
    const interactivas = 'apps/web/src/servidor/lecturas/interactivas.ts';
    const casos = [
      { ruta: c?.ruta ?? '', texto: c?.texto ?? '', falla: true },
      {
        ruta: interactivas,
        texto: "'use server';\nexport async function otraLectura() {}\n",
        falla: true,
      },
      {
        ruta: interactivas,
        texto: `'use server';\n${LISTA_CERRADA.map((n) => `export async function ${n}() {}`).join('\n')}\n`,
        falla: false,
      },
    ];
    for (const caso of casos) {
      const tmp = mkdtempSync(join(tmpdir(), 'finn-lecturas-'));
      try {
        mkdirSync(join(tmp, dirname(caso.ruta)), { recursive: true });
        writeFileSync(join(tmp, caso.ruta), caso.texto);
        expect(verificarLecturas(tmp).length > 0, caso.ruta).toBe(caso.falla);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  });

  it('L12: stylelint rechaza colores literales y deja pasar tokens.css y var()', async () => {
    const c = controlesWeb.find((x) => x.archivo.endsWith('.css'));
    const obtenidas = await reglasCss(c?.texto ?? '', c?.ruta ?? '');
    expect(obtenidas).toContain('color-no-hex');
    expect(obtenidas).toContain('function-disallowed-list');
    expect(await reglasCss(c?.texto ?? '', 'apps/web/src/estilos/tokens.css')).toEqual([]);
    expect(await reglasCss('.a { color: var(--texto); }\n', c?.ruta ?? '')).toEqual([]);
  });

  it(
    'lo permitido pasa: formularios con valores, textos con literales, formato con Intl',
    { timeout: 120_000 },
    () => {
      const deLaTabla = (r: string): boolean =>
        /^parse:|restricted|^finn\/(centavos|archivos-servidor|jsx-deshabilitado)|jsx-no-literals|jsx-a11y/.test(
          r,
        );
      for (const [ruta] of LIMPIOS) {
        expect(lintarWeb(ruta).filter(deLaTabla), ruta).toEqual([]);
      }
    },
  );

  it('las excepciones de 05 §1.7 están en la configuración', async () => {
    const eslint = new ESLint({
      cwd: raiz,
      overrideConfigFile: true,
      overrideConfig: configurar(),
    });
    const nivel = async (ruta: string, regla: string): Promise<unknown> => {
      const c = (await eslint.calculateConfigForFile(join(raiz, ruta))) as {
        rules?: Record<string, unknown>;
      };
      const v = c.rules?.[regla];
      return Array.isArray(v) ? v[0] : v;
    };
    expect(await nivel('apps/web/src/formato/m.ts', 'finn/centavos')).toBeUndefined();
    expect(await nivel('apps/web/src/componentes/dominio/m.ts', 'finn/centavos')).toBe(2);
    expect(await nivel('apps/web/src/textos/t.tsx', 'react/jsx-no-literals')).toBeUndefined();
    expect(await nivel('apps/web/src/componentes/dominio/t.tsx', 'react/jsx-no-literals')).toBe(2);
    expect(
      await nivel('apps/web/src/cliente/almacen.ts', 'no-restricted-properties'),
    ).toBeUndefined();
  });
});
