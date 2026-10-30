// workflows (TA-012; 07 §6.1, §6.2, §32.2; DP-10, DP-33, DP-34; CH-16): lee .github/workflows/ci.yml y comprueba los
// `needs`, la concurrencia, que cada job llame solo a sus `pnpm ci:<job>`, los permisos (solo `rapido` escribe estados
// de commit), que gitleaks esté fijado por versión y suma, y las decisiones de tools/ci/afecta.mjs. Control: el secreto
// falso de tools/lint/controles/secreto.txt hace fallar gitleaks con la configuración por defecto.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ESTADO, decidir as decidirModo, type Estado, type Recorte } from './minutos.ts';

type Paso = {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
};
type Job = {
  name?: string;
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  steps: Paso[];
};
type Workflow = {
  on: Record<string, { types?: string[]; branches?: string[] }>;
  permissions: Record<string, string>;
  concurrency: { group: string; 'cancel-in-progress': string };
  env?: Record<string, string>;
  jobs: Record<string, Job>;
};

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const { load } = createRequire(import.meta.url)('js-yaml') as { load: (s: string) => unknown };
const wf = load(readFileSync(join(raiz, '.github', 'workflows', 'ci.yml'), 'utf8')) as Workflow;
const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const job = (n: string): Job => {
  const j = wf.jobs[n];
  if (!j) throw new Error(`ci.yml no tiene el job ${n}`);
  return j;
};
const lista = (x: string | string[] | undefined): string[] =>
  x === undefined ? [] : Array.isArray(x) ? x : [x];

const LECTURA = { contents: 'read', actions: 'read', 'pull-requests': 'read' };
const INSTALAR = 'pnpm install --frozen-lockfile';
// Lo único que cada job ejecuta, además de la instalación (DP-34). `rapido` lleva `integracion` por M5 (DP-33).
const SCRIPTS: Record<string, string[]> = {
  rapido: ['ci:rapido', 'ci:integracion'],
  e2e: ['ci:e2e'],
  cierre: ['ci:cierre'],
};
const PREPARACION = ['gitleaks', 'pg-version', 'pg-imagen'];

describe('workflows: ci.yml (07 §6.1, §6.2)', () => {
  it('workflows: corre en pull_request (opened, synchronize, ready_for_review) y en push a main', () => {
    expect(wf.on['pull_request']?.types).toEqual(['opened', 'synchronize', 'ready_for_review']);
    expect(wf.on['push']?.branches).toEqual(['main']);
    expect(Object.keys(wf.on).sort()).toEqual(['pull_request', 'push']);
  });

  it('workflows: jobs rapido, e2e y cierre; sin integracion aparte (M5) ni desplegar (B5)', () => {
    expect(Object.keys(wf.jobs).sort()).toEqual(['cierre', 'e2e', 'rapido']);
    for (const [n, j] of Object.entries(wf.jobs)) expect(j.name).toBe(n);
  });

  it('workflows: needs — e2e depende de rapido; cierre de rapido y e2e; rapido de nadie', () => {
    expect(lista(job('rapido').needs)).toEqual([]);
    expect(lista(job('e2e').needs)).toEqual(['rapido']);
    expect(lista(job('cierre').needs).sort()).toEqual(['e2e', 'rapido']);
  });

  it('workflows: e2e, integracion y cierre corren según las salidas de rapido', () => {
    const r = job('rapido');
    for (const s of ['afecta_db', 'afecta_web', 'integracion', 'e2e', 'cierre'])
      expect(r.outputs?.[s]).toBe(`\${{ steps.rapido.outputs.${s} }}`);
    const integ = r.steps.find((p) => p.run === 'pnpm ci:integracion');
    expect(integ?.if).toBe("steps.rapido.outputs.integracion == 'true'");
    expect(job('e2e').if).toBe("needs.rapido.outputs.e2e == 'true'");
    expect(job('cierre').if).toContain("needs.rapido.result == 'success'");
    expect(job('cierre').if).toContain("needs.rapido.outputs.cierre == 'true'");
    expect(job('cierre').if).toContain('!cancelled()');
  });

  it('workflows: concurrencia pr-<número> con cancelación en PR; sin cancelación en main', () => {
    expect(wf.concurrency.group).toBe(
      "${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || 'ci-main' }}",
    );
    expect(wf.concurrency['cancel-in-progress']).toBe("${{ github.event_name == 'pull_request' }}");
  });

  it('workflows: cada job llama solo a su pnpm ci:<job> (DP-34)', () => {
    for (const [n, j] of Object.entries(wf.jobs)) {
      // gitleaks y la imagen de PostgreSQL (CH-22) preparan herramientas; no son suites
      const runs = j.steps.filter((p) => p.run !== undefined && !PREPARACION.includes(p.id ?? ''));
      const scripts = runs.map((p) => p.run?.trim()).filter((r) => r !== INSTALAR);
      expect(scripts, n).toEqual((SCRIPTS[n] ?? []).map((s) => `pnpm ${s}`));
      expect(
        runs.filter((p) => p.run?.trim() === INSTALAR),
        n,
      ).toHaveLength(1);
    }
    for (const s of ['ci:rapido', 'ci:integracion', 'ci:e2e', 'ci:cierre', 'ci:local'])
      expect(pkg.scripts[s], s).toBeDefined();
    expect(pkg.scripts['ci:rapido']).toContain('tools/ci/afecta.mjs rapido');
    expect(pkg.scripts['ci:integracion']).toContain('publicar-resultados.mjs integracion');
  });

  it('workflows: permisos mínimos; rapido agrega statuses: write (CH-16) y e2e issues: write (07 §7.3)', () => {
    expect(wf.permissions).toEqual(LECTURA);
    expect(job('rapido').permissions).toEqual({ ...LECTURA, statuses: 'write' });
    expect(job('e2e').permissions).toEqual({ ...LECTURA, issues: 'write' });
    expect(job('cierre').permissions).toBeUndefined();
  });

  it('workflows: rapido restaura el modo de M4 por prefijo antes de ci:rapido, sin guardarlo (07 §6.5)', () => {
    const pasos = job('rapido').steps;
    const i = pasos.findIndex((p) => p.uses?.startsWith('actions/cache/restore@'));
    expect(pasos[i]?.with).toMatchObject({
      path: 'test-results/ci-modo',
      'restore-keys': 'ci-modo-',
    });
    expect(i).toBeLessThan(pasos.findIndex((p) => p.run === 'pnpm ci:rapido'));
    expect(
      Object.values(wf.jobs)
        .flatMap((j) => j.steps)
        .some(
          (p) => /cache\/save@/.test(p.uses ?? '') && p.with?.['path'] === 'test-results/ci-modo',
        ),
    ).toBe(false);
    expect(wf.env?.['FINN_ACCION']).toBe('${{ github.event.action }}');
  });

  it('workflows: gitleaks fijado por versión y suma, antes de ci:rapido y solo en rapido', () => {
    const pasos = job('rapido').steps;
    const i = pasos.findIndex((p) => p.id === 'gitleaks');
    expect(i).toBeGreaterThanOrEqual(0);
    const g = pasos[i];
    expect(g?.env?.['GITLEAKS_VERSION']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(g?.env?.['GITLEAKS_SHA256']).toMatch(/^[0-9a-f]{64}$/);
    expect(g?.run).toContain('releases/download/v${GITLEAKS_VERSION}/');
    expect(g?.run).toMatch(/echo "\$\{GITLEAKS_SHA256\} {2}\S+" \| sha256sum -c -/);
    expect(i).toBeLessThan(pasos.findIndex((p) => p.run === 'pnpm ci:rapido'));
    for (const n of ['e2e', 'cierre'])
      expect(job(n).steps.some((p) => p.id === 'gitleaks' || /gitleaks/.test(p.run ?? ''))).toBe(
        false,
      );
  });

  it('workflows: la imagen de PostgreSQL se baja por digest de versiones.env, con caché, antes de ci:integracion y solo con integracion (CH-22)', () => {
    const pasos = job('rapido').steps;
    const i = (id: string): number => pasos.findIndex((p) => p.id === id);
    const integ = pasos.findIndex((p) => p.run === 'pnpm ci:integracion');
    const cache = pasos.findIndex(
      (p, k) => k > i('pg-version') && k < i('pg-imagen') && p.uses?.startsWith('actions/cache@'),
    );
    expect(i('pg-version')).toBeGreaterThan(pasos.findIndex((p) => p.run === 'pnpm ci:rapido'));
    expect(cache).toBeGreaterThan(i('pg-version'));
    expect(i('pg-imagen')).toBeLessThan(integ);
    for (const k of [i('pg-version'), cache, i('pg-imagen')])
      expect(pasos[k]?.if).toBe("steps.rapido.outputs.integracion == 'true'");
    expect(pasos[i('pg-version')]?.run).toContain('infra/versiones.env');
    expect(pasos[cache]?.with?.['key']).toBe(
      'pg-${{ steps.pg-version.outputs.PG_MAYOR }}-${{ steps.pg-version.outputs.PG_IMAGEN_DIGEST }}',
    );
    const script = pasos[i('pg-imagen')]?.run ?? '';
    const pulls = [...script.matchAll(/docker pull "([^"]+)"/g)].map((m) => m[1]);
    // ECR primero y el espejo de respaldo, siempre por digest; nunca un pull por tag
    expect(pulls).toEqual(['${ecr}@${PG_IMAGEN_DIGEST}', '${origen}@${PG_IMAGEN_DIGEST}']);
    expect(script).toContain('ecr="public.ecr.aws/docker/library/postgres"');
    expect(script).toContain('origen="mirror.gcr.io/library/postgres"');
    expect(script).not.toMatch(/docker pull [^\n]*:\$\{?PG_MAYOR/);
    expect(script).toContain('docker tag "${origen}@${PG_IMAGEN_DIGEST}" "${ecr}:${PG_MAYOR}"');
    expect(readFileSync(join(raiz, 'infra', 'versiones.env'), 'utf8')).toMatch(
      /^PG_IMAGEN_DIGEST=sha256:[0-9a-f]{64}$/m,
    );
  });

  it('workflows: acciones fijadas por commit y Node de infra/versiones.env', () => {
    const node = /^NODE=(\d+)$/m.exec(readFileSync(join(raiz, 'infra', 'versiones.env'), 'utf8'));
    for (const [n, j] of Object.entries(wf.jobs)) {
      for (const p of j.steps.filter((x) => x.uses !== undefined))
        expect(p.uses, n).toMatch(/^[\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40}$/);
      const setup = j.steps.find((p) => p.uses?.startsWith('actions/setup-node@'));
      expect(String(setup?.with?.['node-version']), n).toBe(node?.[1]);
      expect(setup?.with?.['cache'], n).toBe('pnpm');
    }
  });
});

describe('workflows: nocturno.yml (07 §6.1, §6.5; CH-02)', () => {
  const n = load(
    readFileSync(join(raiz, '.github', 'workflows', 'nocturno.yml'), 'utf8'),
  ) as Workflow;
  const nj = (x: string): Job => n.jobs[x] ?? { steps: [] };

  it('workflows: lunes, miércoles y viernes a las 08:15 UTC, y a mano', () => {
    expect(n.on['schedule']).toEqual([{ cron: '15 8 * * 1,3,5' }]);
    expect(Object.keys(n.on).sort()).toEqual(['schedule', 'workflow_dispatch']);
    expect(n.permissions).toEqual({ contents: 'read' });
    for (const j of Object.values(n.jobs))
      for (const p of j.steps.filter((x) => x.uses !== undefined))
        expect(p.uses).toMatch(/^[\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40}$/);
  });

  it('workflows: minutos corre siempre, solo él lee la API y sube minutos-AAAAMM por 90 días (CH-02)', () => {
    const m = nj('minutos');
    expect(m.permissions).toEqual({ contents: 'read', actions: 'read' });
    expect(m.outputs?.['correr']).toBe('${{ steps.minutos.outputs.correr }}');
    const art = m.steps.find((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(art?.with).toMatchObject({
      name: 'minutos-${{ steps.minutos.outputs.mes }}',
      path: 'test-results/minutos/',
      'retention-days': 90,
    });
  });

  it('workflows: las suites dependen de minutos, corren con correr y llaman solo a pnpm ci:nocturno', () => {
    const suites = Object.entries(n.jobs).filter(([x]) => x !== 'minutos');
    expect(suites.length).toBeGreaterThan(0);
    for (const [x, j] of suites) {
      expect(j.name).toBe(x);
      expect(lista(j.needs), x).toEqual(['minutos']);
      expect(j.if, x).toBe("needs.minutos.outputs.correr == 'true'");
      expect(j.permissions, x).toBeUndefined();
      const runs = j.steps.flatMap((p) => (p.run ? [p.run.trim()] : []));
      expect(runs, x).toEqual([INSTALAR, 'pnpm ci:nocturno']);
    }
    expect(pkg.scripts['ci:nocturno']).toBe('node tools/ci/afecta.mjs nocturno');
  });
});

describe('workflows: decisiones de tools/ci/afecta.mjs', () => {
  // Herméticas: afecta.mjs lee ESTADO relativo al cwd, así que corre en un directorio vacío y no ve el modo real del
  // mes que `rapido` restauró de la caché; su `new Date()` queda fijo en el mes de estas pruebas (07 §7.1).
  const RELOJ = `data:text/javascript,${encodeURIComponent(
    `const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : ['2026-10-19T12:00:00Z'])); } };`,
  )}`;
  let cwd = '';
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'finn-afecta-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  const decidir = (
    evento: string,
    borrador: string,
    archivos: string[],
    accion = 'synchronize',
  ) => {
    const r = spawnSync(
      process.execPath,
      [
        `--import=${RELOJ}`,
        join(raiz, 'tools', 'ci', 'afecta.mjs'),
        '--archivos',
        archivos.join(','),
      ],
      {
        cwd,
        encoding: 'utf8',
        env: {
          ...process.env,
          FINN_EVENTO: evento,
          FINN_BORRADOR: borrador,
          FINN_ACCION: accion,
          GITHUB_OUTPUT: '',
        },
      },
    );
    expect(r.status, r.stderr).toBe(0);
    return JSON.parse(r.stdout) as Record<string, boolean>;
  };
  const conModo = (mes: string, recortes: Recorte[]): void => {
    const f = join(cwd, ESTADO);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify({ mes, modo: 'ahorro', recortes }));
  };

  it('workflows: PR en borrador que solo toca docs no corre integracion ni e2e (M1, M2)', () => {
    const d = decidir('pull_request', 'true', ['docs/07-pruebas.md']);
    expect(d).toMatchObject({
      afecta_db: false,
      afecta_web: false,
      integracion: false,
      e2e: false,
    });
  });

  it('workflows: PR en borrador que toca la base corre integracion, no e2e', () => {
    const d = decidir('pull_request', 'true', ['packages/db/prisma/schema.prisma']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true, e2e: false });
  });

  it('workflows: PR en borrador que solo toca tools/humo corre integracion (PRU-SEG-OPER-103 y 106 viven ahí), no e2e', () => {
    const d = decidir('pull_request', 'true', ['tools/humo/patron.ts']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true, e2e: false });
  });

  it('workflows: PR listo corre integracion siempre y e2e solo con afecta_web', () => {
    expect(decidir('pull_request', 'false', ['docs/x.md'])).toMatchObject({
      integracion: true,
      e2e: false,
    });
    expect(decidir('pull_request', 'false', ['apps/web/src/x.tsx'])).toMatchObject({
      afecta_web: true,
      e2e: true,
    });
  });

  it('workflows: en ahorro, un PR listo corre e2e al pasar a listo y no en synchronize (M4, 07 §6.5)', () => {
    conModo('202610', ['e2e-pr-al-pasar-a-listo', 'nocturno-semanal']);
    const web = ['apps/web/src/x.tsx'];
    expect(decidir('pull_request', 'false', web, 'synchronize')).toMatchObject({
      integracion: true,
      e2e: false,
    });
    expect(decidir('pull_request', 'false', web, 'ready_for_review')).toMatchObject({ e2e: true });
    expect(decidir('push', '', web, '')).toMatchObject({ e2e: true });
  });

  it('workflows: con e2e de PR suspendido, ni al pasar a listo; el modo de otro mes no cuenta (M4)', () => {
    const web = ['apps/web/src/x.tsx'];
    conModo('202610', ['e2e-pr-al-pasar-a-listo', 'e2e-pr-suspendido']);
    expect(decidir('pull_request', 'false', web, 'ready_for_review')).toMatchObject({ e2e: false });
    conModo('202609', ['e2e-pr-al-pasar-a-listo', 'e2e-pr-suspendido']);
    expect(decidir('pull_request', 'false', web, 'synchronize')).toMatchObject({ e2e: true });
  });

  it('workflows: el estado que minutos escribe en el mes en curso pisa los recortes guardados (CH-46)', () => {
    const web = ['apps/web/src/x.tsx'];
    conModo('202610', ['e2e-pr-al-pasar-a-listo', 'e2e-pr-suspendido']);
    const f = join(cwd, ESTADO);
    const nuevo = decidirModo(
      1954,
      new Date('2026-10-19T08:15:00Z'),
      0,
      JSON.parse(readFileSync(f, 'utf8')) as Partial<Estado>,
    );
    writeFileSync(f, JSON.stringify(nuevo));
    expect(decidir('pull_request', 'false', web, 'synchronize')).toMatchObject({ e2e: true });
  });

  it('workflows: en main corren integracion, e2e y cierre siempre', () => {
    expect(decidir('push', '', ['docs/x.md'])).toMatchObject({
      integracion: true,
      e2e: true,
      cierre: true,
    });
  });
});

describe('workflows: control de gitleaks (SEG-gitleaks)', () => {
  const hay = spawnSync('gitleaks', ['version'], { encoding: 'utf8' }).status === 0;
  const enCi = (process.env['CI'] ?? '') !== '';
  const secreto = join(raiz, 'tools', 'lint', 'controles', 'secreto.txt');
  const gitleaks = (config: string) =>
    spawnSync(
      'gitleaks',
      ['dir', secreto, '--config', config, '--no-banner', '--redact', '-v', '--exit-code', '1'],
      { cwd: raiz, encoding: 'utf8' },
    );

  it('workflows: en CI gitleaks está instalado (rapido lo instala antes de ci:rapido)', () => {
    if (enCi) expect(hay).toBe(true);
  });

  it.skipIf(!hay)(
    'workflows: el secreto de control hace fallar gitleaks con las reglas por defecto',
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'finn-gitleaks-'));
      try {
        const config = join(dir, 'por-defecto.toml');
        writeFileSync(config, '[extend]\nuseDefault = true\n');
        const r = gitleaks(config);
        expect(r.status, r.stdout + r.stderr).toBe(1);
        expect(r.stdout + r.stderr).toMatch(/private-key/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );

  it.skipIf(!hay)('workflows: .gitleaks.toml excluye solo el secreto de control', () => {
    const r = gitleaks(join(raiz, '.gitleaks.toml'));
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });
});
