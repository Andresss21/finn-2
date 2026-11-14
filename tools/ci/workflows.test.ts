// workflows (TA-012; 07 §6.1, §6.2, §32.2; DP-10, DP-33, DP-34; CH-16): lee .github/workflows/ci.yml y comprueba los
// `needs`, la concurrencia, que cada job llame solo a sus `pnpm ci:<job>`, los permisos (solo `rapido` escribe estados
// de commit), que gitleaks esté fijado por versión y suma, y las decisiones de tools/ci/afecta.mjs. Control: el secreto
// falso de tools/lint/controles/secreto.txt hace fallar gitleaks con la configuración por defecto.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
  env?: Record<string, string>;
  strategy?: { 'fail-fast'?: boolean; matrix?: Record<string, unknown[]> };
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

// TA-555: evalúa el `if` de un job como GitHub, sin eval: `!cancelled()`, `needs.<job>.result`,
// `needs.<job>.outputs.<x>` (la que falta es ''), `github.<x>`, cadenas, `==`, `!=`, `!`, `&&`, `||` y paréntesis.
type Need = { result: string; outputs?: Record<string, string> };
const ok = (outputs: Record<string, string> = {}): Need => ({
  result: 'success',
  outputs: { integracion: 'true', ...outputs },
});
const PR = { event_name: 'pull_request', ref: 'refs/pull/7/merge' };
function cumple(
  expr: string | undefined,
  needs: Record<string, Need>,
  github: Record<string, string> = {},
  cancelado = false,
): boolean {
  const gh: Record<string, string> = { event_name: 'push', ref: 'refs/heads/main', ...github };
  const fichas = (expr ?? '')
    .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
    .match(/'[^']*'|!=|==|&&|\|\||!|\(|\)|cancelled\(\)|[\w.-]+/g);
  if (fichas === null) throw new Error(`if vacío: ${expr}`);
  const t = fichas;
  let i = 0;
  const valor = (x: string): string | boolean => {
    if (x === 'cancelled()') return cancelado;
    if (x.startsWith("'")) return x.slice(1, -1);
    const [raiz = '', a = '', b = '', c = ''] = x.split('.');
    if (raiz === 'github') return gh[a] ?? '';
    if (raiz === 'needs' && b === 'result') return needs[a]?.result ?? '';
    if (raiz === 'needs' && b === 'outputs') return needs[a]?.outputs?.[c] ?? '';
    throw new Error(`término desconocido en el if: ${x}`);
  };
  const primario = (): string | boolean => {
    const x = t[i++] ?? '';
    if (x === '!') return !primario();
    if (x === '(') {
      const v = o();
      i++;
      return v;
    }
    const v = valor(x);
    if (t[i] === '==' || t[i] === '!=') {
      const op = t[i++];
      const w = valor(t[i++] ?? '');
      return op === '==' ? v === w : v !== w;
    }
    return v;
  };
  const y = (): string | boolean => {
    let v = primario();
    while (t[i] === '&&') {
      i++;
      const w = primario();
      v = Boolean(v) && w;
    }
    return v;
  };
  const o = (): string | boolean => {
    let v = y();
    while (t[i] === '||') {
      i++;
      const w = y();
      v = Boolean(v) || w;
    }
    return v;
  };
  const r = o();
  if (i !== t.length) throw new Error(`if sin evaluar entero: ${expr}`);
  return r === true;
}

const LECTURA = { contents: 'read', actions: 'read', 'pull-requests': 'read' };
const INSTALAR = 'pnpm install --frozen-lockfile';
// Lo único que cada job ejecuta, además de la instalación (DP-34). `rapido` lleva `integracion` por M5 (DP-33).
const SCRIPTS: Record<string, string[]> = {
  rapido: ['ci:rapido', 'ci:integracion'],
  desplegar: ['ci:politica-patrones', 'ci:desplegar'],
};
const PLAYWRIGHT = '~/.cache/ms-playwright';
const PREPARACION = ['gitleaks', 'pg-version', 'pg-imagen'];

describe('workflows: ci.yml (07 §6.1, §6.2)', () => {
  it('workflows: corre en pull_request (opened, synchronize, ready_for_review) y en push a main', () => {
    expect(wf.on['pull_request']?.types).toEqual(['opened', 'synchronize', 'ready_for_review']);
    expect(wf.on['push']?.branches).toEqual(['main']);
    expect(Object.keys(wf.on).sort()).toEqual(['pull_request', 'push']);
  });

  it('workflows: jobs rapido y desplegar; sin integracion aparte (M5) ni E2E ni cierre, que van al nocturno (CH-266)', () => {
    expect(Object.keys(wf.jobs).sort()).toEqual(['desplegar', 'rapido']);
    for (const [n, j] of Object.entries(wf.jobs)) expect(j.name).toBe(n);
  });

  it('workflows: needs — desplegar depende solo de rapido; rapido de nadie (CH-266)', () => {
    expect(lista(job('rapido').needs)).toEqual([]);
    expect(lista(job('desplegar').needs)).toEqual(['rapido']);
  });

  it('workflows: desplegar solo en main y con rapido en verde, con o sin integracion dentro (07 §6.1, M5, CH-266)', () => {
    const d = job('desplegar');
    const verde = { rapido: ok() };
    expect(cumple(d.if, verde)).toBe(true);
    // Un diff sin base (documentos, interfaz) despliega sin integracion; su rojo ya hace fallar `rapido`
    expect(cumple(d.if, { rapido: ok({ integracion: 'false' }) })).toBe(true);
    expect(cumple(d.if, verde, PR)).toBe(false);
    expect(cumple(d.if, verde, { ref: 'refs/heads/otra' })).toBe(false);
    for (const r of ['failure', 'cancelled', 'skipped'])
      expect(cumple(d.if, { rapido: { ...ok(), result: r } }), r).toBe(false);
    expect(cumple(d.if, verde, {}, true)).toBe(false);
  });

  it('workflows: ci.yml no instala navegadores, no restaura e2e-base ni corre ci:reutiliza-e2e (CH-266)', () => {
    const pasos = Object.values(wf.jobs).flatMap((j) => j.steps);
    expect(pasos.some((p) => p.with?.['path'] === PLAYWRIGHT)).toBe(false);
    expect(pasos.some((p) => p.with?.['path'] === 'test-results/e2e-base')).toBe(false);
    expect(pasos.some((p) => /reutiliza-e2e|playwright/.test(p.run ?? ''))).toBe(false);
    const afecta = readFileSync(join(raiz, 'tools', 'ci', 'afecta.mjs'), 'utf8');
    const rapido = /function rapido\([^)]*\) \{[\s\S]*?\n\}/.exec(afecta)?.[0] ?? '';
    expect(rapido).toContain('--project unidad --project escenarios-motor --project contratos');
    for (const fuera of ['NAVEGADORES', 'pruebas:listar', 'pruebas:matriz', 'componentes'])
      expect(rapido, fuera).not.toContain(fuera);
  });

  it('workflows: desplegar corre politica-patrones sin secretos y da los secretos solo a ci:desplegar, sin guardia que lo saltee (TA-260)', () => {
    const pasos = job('desplegar').steps;
    const politica = pasos.findIndex((p) => p.run === 'pnpm ci:politica-patrones');
    const desplegar = pasos.findIndex((p) => p.run === 'pnpm ci:desplegar');
    expect(politica).toBeGreaterThanOrEqual(0);
    expect(politica).toBeLessThan(desplegar);
    for (const [i, p] of pasos.entries()) {
      expect(p.if, p.run ?? p.uses).toBeUndefined();
      if (i !== desplegar) expect(p.env, p.run ?? p.uses).toBeUndefined();
    }
    expect(Object.keys(pasos[desplegar]?.env ?? {}).sort()).toEqual([
      'DIRECT_URL',
      'GITHUB_TOKEN',
      'RESPALDO_DB_URL',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'VERCEL_TOKEN',
    ]);
    expect(pkg.scripts['ci:desplegar']).toBe('node tools/ci/desplegar.mjs');
    const fijada = (
      JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
        devDependencies: Record<string, string>;
      }
    ).devDependencies['vercel'];
    expect(fijada).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('workflows: integracion corre según la salida de rapido, que publica solo afecta_db, afecta_web e integracion (CH-266)', () => {
    const r = job('rapido');
    expect(Object.keys(r.outputs ?? {}).sort()).toEqual(['afecta_db', 'afecta_web', 'integracion']);
    for (const s of ['afecta_db', 'afecta_web', 'integracion'])
      expect(r.outputs?.[s]).toBe(`\${{ steps.rapido.outputs.${s} }}`);
    const integ = r.steps.find((p) => p.run === 'pnpm ci:integracion');
    expect(integ?.if).toBe("steps.rapido.outputs.integracion == 'true'");
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
    for (const s of [
      'ci:rapido',
      'ci:integracion',
      'ci:e2e',
      'ci:e2e-unir',
      'ci:cierre',
      'ci:local',
    ])
      expect(pkg.scripts[s], s).toBeDefined();
    expect(pkg.scripts['ci:rapido']).toContain('tools/ci/afecta.mjs rapido');
    expect(pkg.scripts['ci:integracion']).toContain('publicar-resultados.mjs integracion');
  });

  it('workflows: permisos mínimos; rapido agrega statuses: write (CH-16) y desplegar solo contents: write (CH-64)', () => {
    expect(wf.permissions).toEqual(LECTURA);
    expect(job('rapido').permissions).toEqual({ ...LECTURA, statuses: 'write' });
    expect(job('desplegar').permissions).toEqual({ contents: 'write' });
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
    expect(
      job('desplegar').steps.some((p) => p.id === 'gitleaks' || /gitleaks/.test(p.run ?? '')),
    ).toBe(false);
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

  it('workflows: prop, ren, respaldo y suites dependen de minutos, corren con correr y llaman solo a pnpm ci:nocturno', () => {
    for (const x of ['prop', 'ren', 'respaldo', 'suites']) {
      const j = nj(x);
      expect(j.name).toBe(x);
      expect(lista(j.needs), x).toEqual(['minutos']);
      expect(j.if, x).toBe("needs.minutos.outputs.correr == 'true'");
      expect(j.permissions, x).toBeUndefined();
      const runs = j.steps.flatMap((p) => (p.run ? [p.run.trim()] : []));
      expect(runs, x).toEqual([INSTALAR, 'pnpm ci:nocturno']);
    }
    expect(pkg.scripts['ci:nocturno']).toBe('node tools/ci/afecta.mjs nocturno');
    expect(Object.keys(n.jobs).sort()).toEqual([
      'cierre',
      'e2e',
      'e2e-fragmento',
      'minutos',
      'prop',
      'ren',
      'respaldo',
      'suites',
    ]);
  });

  it('workflows: suites corre en Chromium unidad, escenarios, contratos, componentes e integracion, y sube sus informes para M15 (CH-266)', () => {
    const s = nj('suites');
    expect(s.env).toEqual({ FINN_NOCTURNO: 'suites' });
    const cache = s.steps.findIndex((p) => p.with?.['path'] === PLAYWRIGHT);
    expect(cache).toBeGreaterThanOrEqual(0);
    expect(cache).toBeLessThan(s.steps.findIndex((p) => p.run === 'pnpm ci:nocturno'));
    const subir = s.steps.find((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(subir?.with).toMatchObject({ name: 'informes-suites', path: 'test-results/informes/' });
    expect(subir?.if).toBe('${{ !cancelled() }}');
    const afecta = readFileSync(join(raiz, 'tools', 'ci', 'afecta.mjs'), 'utf8');
    const suites = /FINN_NOCTURNO === 'suites'\) \{[\s\S]*?\n {2}\}/.exec(afecta)?.[0] ?? '';
    expect(suites).toMatch(/\['navegadores', NAVEGADORES\],\s+\[\s+'pruebas'/);
    for (const p of ['unidad', 'escenarios-motor', 'contratos', 'componentes'])
      expect(suites).toContain(`--project ${p}`);
    expect(suites).toContain("jsonEn('rapido')");
    expect(suites).toContain("pnpm test:integracion ${jsonEn('integracion')}");
  });

  it('workflows: la E2E completa corre en fragmentos 1..n con --shard i/n, sin cortar a los demás si uno falla, y cada uno sube su blob (CH-231, CH-266)', () => {
    const f = nj('e2e-fragmento');
    expect(f.name).toBe('e2e-fragmento-${{ matrix.fragmento }}');
    expect(lista(f.needs)).toEqual(['minutos']);
    expect(f.if).toBe("needs.minutos.outputs.correr == 'true'");
    const fragmentos = f.strategy?.matrix?.['fragmento'] ?? [];
    expect(f.strategy?.['fail-fast']).toBe(false);
    expect(fragmentos).toEqual(Array.from({ length: fragmentos.length }, (_, i) => i + 1));
    expect(fragmentos.length).toBeGreaterThanOrEqual(3);
    expect(f.env).toEqual({
      FINN_E2E_GREP: 'todas',
      FINN_E2E_FRAGMENTO: `\${{ matrix.fragmento }}/${fragmentos.length}`,
    });
    expect(f.steps.flatMap((p) => (p.run ? [p.run.trim()] : []))).toEqual([
      INSTALAR,
      'pnpm ci:e2e',
    ]);
    const subidas = f.steps.filter((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(subidas.map((p) => [p.with?.['name'], p.with?.['path'], p.if])).toEqual([
      ['e2e-blob-${{ matrix.fragmento }}', 'test-results/e2e-blob/', '${{ !cancelled() }}'],
      ['e2e-trazas-${{ matrix.fragmento }}', 'apps/web/test-results/', '${{ !cancelled() }}'],
    ]);
    // Ningún artefacto de un fragmento entra en `cierre` (descarga `informes-*`)
    for (const s of subidas) expect(String(s.with?.['name'])).not.toMatch(/^informes-/);
  });

  it('workflows: el job e2e une los blobs, pasa solo con todos los fragmentos en verde y sube informes-e2e (CH-231, CH-266)', () => {
    const e = nj('e2e');
    expect(lista(e.needs).sort()).toEqual(['e2e-fragmento', 'minutos']);
    expect(e.permissions).toEqual({ contents: 'read', issues: 'write' });
    const verde = { minutos: { result: 'success', outputs: { correr: 'true' } } };
    expect(cumple(e.if, { ...verde, 'e2e-fragmento': { result: 'failure' } })).toBe(true);
    expect(cumple(e.if, { minutos: { result: 'success', outputs: { correr: 'false' } } })).toBe(
      false,
    );
    expect(cumple(e.if, verde, {}, true)).toBe(false);
    const pasos = e.steps;
    const bajar = pasos.findIndex((p) => p.uses?.startsWith('actions/download-artifact@'));
    const unir = pasos.findIndex((p) => p.run === 'pnpm ci:e2e-unir');
    expect(pasos[bajar]?.with).toMatchObject({
      pattern: 'e2e-blob-*',
      'merge-multiple': true,
      path: 'test-results/e2e-blob',
    });
    expect(bajar).toBeLessThan(unir);
    expect(pasos[unir]?.env?.['FINN_E2E_FRAGMENTOS']).toBe('${{ needs.e2e-fragmento.result }}');
    expect(pasos[unir]?.env?.['FINN_E2E_GREP']).toBe('todas');
    const subir = pasos.find((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(subir?.with).toMatchObject({ name: 'informes-e2e', path: 'apps/web/test-results/' });
    expect(subir?.if).toBe('${{ !cancelled() }}');
    expect(pkg.scripts['ci:e2e-unir']).toBe('node tools/ci/afecta.mjs e2e-unir');
  });

  // El proyecto `componentes` recolecta en Chromium: sin él `vitest list` sale con 0 y sin JSON (corrida 41143522674)
  it('PRU-SEG-OPER-111 [M15] CH-266: cierre del nocturno corre M15 con los informes de suites y e2e de la corrida, con Chromium antes de listar', () => {
    const c = nj('cierre');
    expect(lista(c.needs).sort()).toEqual(['e2e', 'minutos', 'suites']);
    expect(c.permissions).toBeUndefined();
    const correr = { minutos: { result: 'success', outputs: { correr: 'true' } } };
    // Corre aunque `suites` o `e2e` hayan fallado: M15 dice qué ficha terminada quedó sin verde
    expect(cumple(c.if, { ...correr, suites: { result: 'failure' }, e2e: { result: 'failure' } })).toBe(
      true,
    );
    expect(cumple(c.if, { minutos: { result: 'success', outputs: { correr: 'false' } } })).toBe(
      false,
    );
    expect(cumple(c.if, correr, {}, true)).toBe(false);
    const pasos = c.steps;
    const cierre = pasos.findIndex((p) => p.run === 'pnpm ci:cierre');
    const bajar = pasos.findIndex((p) => p.uses?.startsWith('actions/download-artifact@'));
    expect(pasos[bajar]?.with).toEqual({
      pattern: 'informes-*',
      'merge-multiple': true,
      path: 'test-results/informes',
    });
    expect(bajar).toBeLessThan(cierre);
    const cache = pasos.findIndex((p) => p.with?.['path'] === PLAYWRIGHT);
    expect(cache).toBeGreaterThanOrEqual(0);
    expect(cache).toBeLessThan(cierre);
    expect(pkg.scripts['ci:cierre']).toMatch(
      /^pnpm exec playwright install --with-deps chromium && pnpm pruebas:listar && .*matriz\.ts verificar --resultados test-results\/informes/,
    );
  });
});

describe('workflows: fuentes sin red en el build (CH-58)', () => {
  const app = join(raiz, 'apps', 'web', 'src');

  it('workflows: apps/web/src no usa next/font/google ni los hosts de Google Fonts', () => {
    const fuentes = readdirSync(app, { recursive: true, encoding: 'utf8' }).filter((f) =>
      /\.(tsx?|css)$/.test(f),
    );
    expect(fuentes.length).toBeGreaterThan(0);
    const conRed = fuentes.filter((f) =>
      /next\/font\/google|fonts\.(googleapis|gstatic)\.com/.test(
        readFileSync(join(app, f), 'utf8'),
      ),
    );
    expect(conRed).toEqual([]);
  });

  it('workflows: layout.tsx carga con next/font/local los woff2 versionados, con su licencia OFL al lado', () => {
    const layout = readFileSync(join(app, 'app', 'layout.tsx'), 'utf8');
    expect(layout).toContain("from 'next/font/local'");
    const rutas = [...layout.matchAll(/\.\.\/fuentes\/[\w.-]+\.woff2/g)].map((m) => m[0]);
    expect(rutas).toHaveLength(3);
    for (const r of rutas) expect(existsSync(join(app, 'app', r))).toBe(true);
    for (const l of ['OFL-Archivo.txt', 'OFL-Big-Shoulders-Display.txt'])
      expect(readFileSync(join(app, 'fuentes', l), 'utf8')).toContain('SIL Open Font License');
  });
});

describe('workflows: decisiones de tools/ci/afecta.mjs', () => {
  // Herméticas: afecta.mjs lee pruebas/ y test-results/ relativos al cwd, así que corre en un directorio vacío; su
  // `new Date()` queda fijo en el mes de estas pruebas (07 §7.1).
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
  // CH-266: la decisión ya no trae e2e, cierre ni reutiliza_e2e; la E2E y `cierre` corren en el nocturno
  const SIN_E2E = ['e2e', 'cierre', 'reutiliza_e2e', 'grep_e2e'];
  const sinE2e = (d: Record<string, boolean>): void => {
    for (const k of SIN_E2E) expect(d, k).not.toHaveProperty(k);
  };

  it('workflows: PR que solo toca docs no corre integracion, en borrador ni listo (M1, CH-266)', () => {
    for (const borrador of ['true', 'false']) {
      const d = decidir('pull_request', borrador, ['docs/07-pruebas.md']);
      expect(d).toMatchObject({ afecta_db: false, afecta_web: false, integracion: false });
      sinE2e(d);
    }
  });

  it('workflows: PR que toca la base corre integracion', () => {
    const d = decidir('pull_request', 'true', ['packages/db/prisma/schema.prisma']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true });
  });

  it('workflows: un cambio en servidor/ corre integracion: PRU-SEG-ACCESO-001 es la barrera de las acciones de cada ficha', () => {
    const d = decidir('pull_request', 'true', ['apps/web/src/servidor/acciones/compras.ts']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true });
  });

  it('workflows: PR que solo toca tools/humo corre integracion (PRU-SEG-OPER-103 y 106 viven ahí)', () => {
    const d = decidir('pull_request', 'true', ['tools/humo/patron.ts']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true });
  });

  it('workflows: PR que solo toca tools/respaldo corre integracion (CH-58)', () => {
    const d = decidir('pull_request', 'true', ['tools/respaldo/restaurar.sh']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true });
  });

  it('workflows: PR listo con un cambio de interfaz no corre integracion ni E2E (CH-266)', () => {
    const d = decidir('pull_request', 'false', ['apps/web/src/x.tsx'], 'ready_for_review');
    expect(d).toMatchObject({ afecta_web: true, afecta_db: false, integracion: false });
    sinE2e(d);
  });

  it('workflows: el PR o ci:local que pasa una ficha a terminada no corre E2E ni cierre: M15 va al nocturno (CH-266)', () => {
    mkdirSync(join(cwd, 'pruebas'));
    writeFileSync(join(cwd, 'pruebas', 'features.json'), JSON.stringify({ 'FT-01': 'terminada' }));
    for (const evento of ['pull_request', '']) {
      const d = decidir(evento, 'true', ['pruebas/features.json']);
      expect(d).toMatchObject({ afecta_web: false, integracion: false });
      sinE2e(d);
    }
  });

  it('workflows: en main, integracion solo con afecta_db y sin E2E ni cierre (M1, CH-266)', () => {
    const docs = decidir('push', '', ['docs/x.md']);
    expect(docs).toMatchObject({ integracion: false });
    sinE2e(docs);
    expect(decidir('push', '', ['packages/aplicacion/src/x.ts'])).toMatchObject({
      integracion: true,
    });
    // El archivo que dejaba `ci:reutiliza-e2e` ya no cambia la decisión
    const f = join(cwd, 'test-results', 'reutiliza-e2e.json');
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify({ reutiliza: true, run_id: 4242 }));
    sinE2e(decidir('push', '', ['apps/web/src/x.tsx']));
  });

  it('workflows: ci:local corto solo con un diff de interfaz: solo-interfaz, mixto, dominio, servidor y arnés (CH-231)', () => {
    const corto = (...a: string[]): boolean => decidir('', '', a)['solo_interfaz'] ?? false;
    expect(
      corto(
        'apps/web/src/componentes/monto.tsx',
        'apps/web/src/app/(finn)/layout.tsx',
        'apps/web/e2e/pantallas/inicio/inicio.e2e.ts',
        'apps/web/tailwind.css',
      ),
    ).toBe(true);
    expect(corto('apps/web/src/x.tsx', 'packages/dominio/src/periodos.ts')).toBe(false);
    expect(corto('packages/dominio/src/periodos.ts')).toBe(false);
    expect(corto('apps/web/src/x.tsx', 'packages/aplicacion/src/x.ts')).toBe(false);
    expect(corto('apps/web/src/servidor/acciones/compras.ts')).toBe(false);
    expect(corto('apps/web/src/app/api/tarea/route.ts')).toBe(false);
    expect(corto('apps/web/src/x.tsx', 'tools/ci/afecta.mjs')).toBe(false);
    expect(corto('apps/web/src/x.tsx', '.github/workflows/ci.yml')).toBe(false);
    expect(corto('apps/web/playwright.config.ts')).toBe(false);
    expect(corto('apps/web/e2e/ayudas/esperas.ts')).toBe(false);
    expect(corto('apps/web/package.json')).toBe(false);
    // CH-239: documentos y plan no sacan del modo corto (toda tarea toca plan/tareas.json)
    expect(corto('apps/web/src/x.tsx', 'docs/07-pruebas.md', 'plan/tareas.json')).toBe(true);
    expect(corto('docs/07-pruebas.md')).toBe(false);
    expect(corto()).toBe(false);
  });

  it('workflows: la clase del diff sale en clase_e2e: color, color + plan, pantalla + docs, pantalla + base, dominio y desconocido (CH-239)', () => {
    const clase = (evento: string, ...a: string[]): unknown =>
      decidir(evento, 'false', a)['clase_e2e'];
    const color = 'apps/web/src/app/tokens.css';
    const pantalla = 'apps/web/src/app/(finn)/metas/pantalla.tsx';
    for (const ev of ['pull_request', '']) {
      expect(clase(ev, color)).toBe(1);
      expect(clase(ev, color, 'plan/tareas.json')).toBe(1);
      expect(clase(ev, pantalla, 'docs/08-tareas.md')).toBe(2);
      expect(clase(ev, pantalla, 'apps/web/src/componentes/base/boton.tsx')).toBe(3);
      expect(clase(ev, 'packages/dominio/src/periodos.ts')).toBe(3);
      expect(clase(ev, 'algo/raro.txt')).toBe(3);
      expect(clase(ev, 'plan/tareas.json')).toBe(0);
    }
    // En local, color + plan y pantalla + docs van en modo corto (CH-239)
    expect(decidir('', '', [color, 'plan/tareas.json'])['solo_interfaz']).toBe(true);
    expect(decidir('', '', [pantalla, 'docs/08-tareas.md'])['solo_interfaz']).toBe(true);
    // En main sin la base de la última E2E completa (caché vacía), clase 3: la completa
    expect(decidir('push', '', [color])).toMatchObject({ clase_e2e: 3, base_e2e: '' });
  });

  it('workflows: cierre de main con E2E parcial suma el informe de su base completa, y sin él falla (CH-239)', () => {
    const SHA = 'a'.repeat(40);
    const correr = (modo: string, env: Record<string, string>) =>
      spawnSync(process.execPath, [join(raiz, 'tools', 'ci', 'afecta.mjs'), modo], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_OUTPUT: '', FINN_REUTILIZA_E2E: '', ...env },
      });
    const parcial = { FINN_EVENTO: 'push', FINN_E2E_GREP: 'PRU-E2E-PWA-007', FINN_BASE_E2E: SHA };
    const sumado = join(cwd, 'test-results', 'informes', 'e2e-base.json');
    // En un PR, o en main con la completa (propia o reutilizada), no suma nada
    for (const env of [
      { FINN_EVENTO: 'pull_request', FINN_E2E_GREP: 'PRU-E2E-PWA-007' },
      { FINN_EVENTO: 'push', FINN_E2E_GREP: 'todas' },
      { ...parcial, FINN_REUTILIZA_E2E: '4242' },
    ])
      expect(correr('cierre-previo', env).status).toBe(0);
    expect(existsSync(sumado)).toBe(false);
    // Parcial sin base, o con otra base que la que eligió rapido: rojo
    expect(correr('cierre-previo', parcial).status).toBe(1);
    const base = join(cwd, 'test-results', 'e2e-base');
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, 'informe.json'), '{"suites":[]}');
    writeFileSync(join(base, 'base.json'), JSON.stringify({ sha: 'b'.repeat(40) }));
    expect(correr('cierre-previo', parcial).status).toBe(1);
    expect(correr('cierre-previo', { ...parcial, FINN_E2E_GREP: '^$' }).status).toBe(1);
    writeFileSync(join(base, 'base.json'), JSON.stringify({ sha: SHA }));
    expect(correr('cierre-previo', parcial).status).toBe(0);
    expect(readFileSync(sumado, 'utf8')).toBe('{"suites":[]}');
  });

  it('workflows: cierre de main con la E2E completa deja su informe y su commit como nueva base; con la parcial, no (CH-239)', () => {
    const SHA = 'c'.repeat(40);
    const informes = join(cwd, 'test-results', 'informes');
    mkdirSync(informes, { recursive: true });
    writeFileSync(join(informes, 'informe.json'), '{"suites":[1]}');
    const salida = join(cwd, 'salida.txt');
    const guardar = (env: Record<string, string>) => {
      writeFileSync(salida, '');
      const r = spawnSync(
        process.execPath,
        [join(raiz, 'tools', 'ci', 'afecta.mjs'), 'cierre-guardar'],
        {
          cwd,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_OUTPUT: salida,
            GITHUB_SHA: SHA,
            FINN_REUTILIZA_E2E: '',
            ...env,
          },
        },
      );
      expect(r.status, r.stderr).toBe(0);
      return readFileSync(salida, 'utf8');
    };
    const base = join(cwd, 'test-results', 'e2e-base', 'base.json');
    expect(guardar({ FINN_EVENTO: 'push', FINN_E2E_GREP: 'PRU-E2E-PWA-007' })).toBe('');
    expect(guardar({ FINN_EVENTO: 'pull_request', FINN_E2E_GREP: 'todas' })).toBe('');
    expect(existsSync(base)).toBe(false);
    expect(guardar({ FINN_EVENTO: 'push', FINN_E2E_GREP: '', FINN_REUTILIZA_E2E: '4242' })).toBe(
      `base_e2e_nueva=${SHA}\n`,
    );
    expect(guardar({ FINN_EVENTO: 'push', FINN_E2E_GREP: 'todas' })).toBe(
      `base_e2e_nueva=${SHA}\n`,
    );
    expect(JSON.parse(readFileSync(base, 'utf8'))).toEqual({ sha: SHA });
    expect(readFileSync(join(dirname(base), 'informe.json'), 'utf8')).toBe('{"suites":[1]}');
  });

  it('workflows: en CI un cambio de CI corre la E2E completa; en local y sin cambios de CI, como antes (CH-231)', () => {
    const completa = (evento: string, ...a: string[]): boolean =>
      decidir(evento, 'false', a)['e2e_completa'] ?? false;
    expect(completa('pull_request', '.github/workflows/ci.yml')).toBe(true);
    expect(completa('pull_request', 'tools/ci/afecta.mjs', 'docs/x.md')).toBe(true);
    expect(completa('pull_request', 'apps/web/src/x.tsx')).toBe(false);
    expect(completa('pull_request', 'packages/dominio/src/periodos.ts')).toBe(false);
    expect(completa('', '.github/workflows/ci.yml')).toBe(false);
  });

  it('workflows: ci:e2e-unir falla si algún fragmento no pasó y pasa sin blobs si todos pasaron (CH-231)', () => {
    const unir = (resultado: string) =>
      spawnSync(
        process.execPath,
        [
          `--import=${RELOJ}`,
          join(raiz, 'tools', 'ci', 'afecta.mjs'),
          'e2e-unir',
          '--archivos',
          'x',
        ],
        {
          cwd,
          encoding: 'utf8',
          env: { ...process.env, FINN_E2E_FRAGMENTOS: resultado, GITHUB_OUTPUT: '' },
        },
      );
    expect(unir('success').status).toBe(0);
    for (const r of ['failure', 'cancelled', 'skipped', '']) {
      const s = unir(r);
      expect(s.status, r).toBe(1);
      expect(s.stderr).toMatch(/los fragmentos terminaron/);
    }
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
