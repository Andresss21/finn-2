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
  rapido: ['ci:reutiliza-e2e', 'ci:rapido', 'ci:integracion'],
  'e2e-fragmento': ['ci:e2e'],
  e2e: ['ci:e2e-unir'],
  cierre: ['ci:cierre'],
  desplegar: ['ci:politica-patrones', 'ci:desplegar'],
};
const PREPARACION = ['gitleaks', 'pg-version', 'pg-imagen'];

describe('workflows: ci.yml (07 §6.1, §6.2)', () => {
  it('workflows: corre en pull_request (opened, synchronize, ready_for_review) y en push a main', () => {
    expect(wf.on['pull_request']?.types).toEqual(['opened', 'synchronize', 'ready_for_review']);
    expect(wf.on['push']?.branches).toEqual(['main']);
    expect(Object.keys(wf.on).sort()).toEqual(['pull_request', 'push']);
  });

  it('workflows: jobs rapido, e2e-fragmento, e2e, cierre y desplegar; sin integracion aparte (M5, CH-231)', () => {
    expect(Object.keys(wf.jobs).sort()).toEqual([
      'cierre',
      'desplegar',
      'e2e',
      'e2e-fragmento',
      'rapido',
    ]);
    for (const [n, j] of Object.entries(wf.jobs))
      expect(j.name).toBe(n === 'e2e-fragmento' ? `${n}-\${{ matrix.fragmento }}` : n);
  });

  it('workflows: needs — e2e-fragmento depende de rapido; e2e de los dos; cierre de rapido y e2e; rapido de nadie', () => {
    expect(lista(job('rapido').needs)).toEqual([]);
    expect(lista(job('e2e-fragmento').needs)).toEqual(['rapido']);
    expect(lista(job('e2e').needs).sort()).toEqual(['e2e-fragmento', 'rapido']);
    expect(lista(job('cierre').needs).sort()).toEqual(['e2e', 'rapido']);
  });

  it('workflows: desplegar solo en main, con todo en verde en la misma corrida e integracion dentro de rapido (07 §6.1, M5)', () => {
    const d = job('desplegar');
    expect(lista(d.needs).sort()).toEqual(['cierre', 'e2e', 'rapido']);
    const verde = { rapido: ok(), e2e: ok(), cierre: ok() };
    expect(cumple(d.if, verde)).toBe(true);
    expect(cumple(d.if, verde, PR)).toBe(false);
    expect(cumple(d.if, verde, { ref: 'refs/heads/otra' })).toBe(false);
    expect(cumple(d.if, { ...verde, rapido: ok({ integracion: 'false' }) })).toBe(false);
    for (const r of ['failure', 'cancelled', 'skipped']) {
      expect(cumple(d.if, { ...verde, rapido: { ...ok(), result: r } }), r).toBe(false);
      expect(cumple(d.if, { ...verde, e2e: { result: r } }), r).toBe(false);
      expect(cumple(d.if, { ...verde, cierre: { result: r } }), r).toBe(false);
    }
    expect(cumple(d.if, verde, {}, true)).toBe(false);
  });

  it('workflows: desplegar acepta e2e saltado solo con reutiliza_e2e, y nunca e2e rojo ni cierre sin correr (TA-555)', () => {
    const d = job('desplegar').if;
    const reusa = ok({ reutiliza_e2e: '4242' });
    expect(cumple(d, { rapido: reusa, e2e: { result: 'skipped' }, cierre: ok() })).toBe(true);
    expect(cumple(d, { rapido: ok(), e2e: { result: 'skipped' }, cierre: ok() })).toBe(false);
    expect(cumple(d, { rapido: reusa, e2e: { result: 'failure' }, cierre: ok() })).toBe(false);
    expect(cumple(d, { rapido: reusa, e2e: { result: 'cancelled' }, cierre: ok() })).toBe(false);
    for (const r of ['skipped', 'failure'])
      expect(cumple(d, { rapido: reusa, e2e: { result: 'skipped' }, cierre: { result: r } })).toBe(
        false,
      );
  });

  it('workflows: cierre de main baja informes-e2e de la corrida reutilizada, solo con reutiliza_e2e (TA-555)', () => {
    const pasos = job('cierre').steps;
    const bajadas = pasos.filter((p) => p.uses?.startsWith('actions/download-artifact@'));
    expect(bajadas.map((p) => p.if)).toEqual([
      undefined,
      "needs.rapido.outputs.reutiliza_e2e != ''",
    ]);
    expect(bajadas[1]?.with).toEqual({
      name: 'informes-e2e',
      path: 'test-results/informes',
      'run-id': '${{ needs.rapido.outputs.reutiliza_e2e }}',
      'github-token': '${{ github.token }}',
    });
    expect(pasos.indexOf(bajadas[1] as Paso)).toBeLessThan(
      pasos.findIndex((p) => p.run === 'pnpm ci:cierre'),
    );
    // Lo lee con el permiso actions: read del workflow, sin escribir nada (pruebas:puerta y M15 no cambian)
    expect(job('cierre').permissions).toBeUndefined();
    expect(wf.permissions['actions']).toBe('read');
    expect(pkg.scripts['ci:cierre']).toContain(
      'matriz.ts verificar --resultados test-results/informes',
    );
  });

  it('workflows: cierre corre con reutiliza_e2e en main y, en un PR, con cierre o con la E2E completa en verde (CH-237)', () => {
    const c = job('cierre').if;
    const main = {
      rapido: ok({ cierre: 'true', reutiliza_e2e: '4242' }),
      e2e: { result: 'skipped' },
    };
    expect(cumple(c, main)).toBe(true);
    expect(cumple(c, { ...main, e2e: { result: 'failure' } })).toBe(false);
    const pr = (grep: string, e2e: string, cierre = 'false'): boolean =>
      cumple(c, { rapido: ok({ cierre, grep_e2e: grep }), e2e: { result: e2e } }, PR);
    expect(pr('todas', 'success')).toBe(true);
    expect(pr('todas', 'skipped')).toBe(false);
    expect(pr('todas', 'failure')).toBe(false);
    expect(pr('PRU-E2E-INI-001', 'success')).toBe(false);
    expect(pr('^$', 'skipped')).toBe(false);
    expect(pr('PRU-E2E-INI-001', 'success', 'true')).toBe(true);
    expect(pr('^$', 'skipped', 'true')).toBe(true);
    const rojo = { ...ok({ cierre: 'true' }), result: 'failure' };
    expect(cumple(c, { rapido: rojo, e2e: ok() })).toBe(false);
  });

  it('workflows: ci:reutiliza-e2e corre solo en main, antes de ci:rapido y es el único paso de rapido con el token (TA-555)', () => {
    const pasos = job('rapido').steps;
    const i = pasos.findIndex((p) => p.run === 'pnpm ci:reutiliza-e2e');
    expect(pasos[i]?.if).toBe("github.event_name == 'push'");
    expect(pasos[i]?.env).toEqual({ GITHUB_TOKEN: '${{ github.token }}' });
    expect(i).toBeLessThan(pasos.findIndex((p) => p.run === 'pnpm ci:rapido'));
    expect(pasos.find((p) => p.run === 'pnpm ci:rapido')?.env).toBeUndefined();
    expect(job('rapido').outputs?.['reutiliza_e2e']).toBe(
      '${{ steps.rapido.outputs.reutiliza_e2e }}',
    );
    expect(pkg.scripts['ci:reutiliza-e2e']).toBe('node tools/ci/reutiliza-e2e.ts');
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

  it('workflows: e2e, integracion y cierre corren según las salidas de rapido', () => {
    const r = job('rapido');
    for (const s of ['afecta_db', 'afecta_web', 'integracion', 'e2e', 'cierre'])
      expect(r.outputs?.[s]).toBe(`\${{ steps.rapido.outputs.${s} }}`);
    const integ = r.steps.find((p) => p.run === 'pnpm ci:integracion');
    expect(integ?.if).toBe("steps.rapido.outputs.integracion == 'true'");
    expect(job('e2e-fragmento').if).toBe("needs.rapido.outputs.e2e == 'true'");
    expect(job('e2e').if).toBe("${{ !cancelled() && needs.rapido.outputs.e2e == 'true' }}");
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

  // El proyecto `componentes` recolecta en Chromium: sin él `vitest list` sale con 0 y sin JSON (corrida 41143522674)
  it('workflows: todo job que lista las pruebas tiene Chromium antes de listar', () => {
    const instalar = 'pnpm exec playwright install --with-deps chromium';
    const cierre = pkg.scripts['ci:cierre'] ?? '';
    expect(cierre.startsWith(`${instalar} && pnpm pruebas:listar && `)).toBe(true);
    for (const n of ['rapido', 'cierre']) {
      const pasos = job(n).steps;
      const cache = pasos.findIndex((p) => p.with?.['path'] === '~/.cache/ms-playwright');
      expect(cache, n).toBeGreaterThanOrEqual(0);
      expect(cache, n).toBeLessThan(pasos.findIndex((p) => p.run === `pnpm ci:${n}`));
    }
    // En `rapido`, sin depender de si cambió la web y antes del inventario
    const afecta = readFileSync(join(raiz, 'tools', 'ci', 'afecta.mjs'), 'utf8');
    expect(afecta).toMatch(
      /\.\.\.\(enCi \? \[\['navegadores', NAVEGADORES\]\] : \[\]\),\s+\['inventario', 'pnpm pruebas:listar'\]/,
    );
  });

  it('workflows: permisos mínimos; rapido agrega statuses: write (CH-16), e2e issues: write (07 §7.3) y desplegar solo contents: write (CH-64)', () => {
    expect(wf.permissions).toEqual(LECTURA);
    expect(job('rapido').permissions).toEqual({ ...LECTURA, statuses: 'write' });
    expect(job('e2e').permissions).toEqual({ ...LECTURA, issues: 'write' });
    expect(job('e2e-fragmento').permissions).toBeUndefined();
    expect(job('cierre').permissions).toBeUndefined();
    expect(job('desplegar').permissions).toEqual({ contents: 'write' });
  });

  it('workflows: la E2E corre en fragmentos 1..n con --shard i/n, sin cortar a los demás si uno falla, y cada uno sube su blob (CH-231)', () => {
    const f = job('e2e-fragmento');
    const fragmentos = f.strategy?.matrix?.['fragmento'] ?? [];
    expect(f.strategy?.['fail-fast']).toBe(false);
    expect(fragmentos).toEqual(Array.from({ length: fragmentos.length }, (_, i) => i + 1));
    expect(fragmentos.length).toBeGreaterThanOrEqual(3);
    expect(f.env?.['FINN_E2E_FRAGMENTO']).toBe(`\${{ matrix.fragmento }}/${fragmentos.length}`);
    expect(f.env?.['FINN_E2E_GREP']).toBe('${{ needs.rapido.outputs.grep_e2e }}');
    const subidas = f.steps.filter((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(subidas.map((p) => [p.with?.['name'], p.with?.['path'], p.if])).toEqual([
      ['e2e-blob-${{ matrix.fragmento }}', 'test-results/e2e-blob/', '${{ !cancelled() }}'],
      ['e2e-trazas-${{ matrix.fragmento }}', 'apps/web/test-results/', '${{ !cancelled() }}'],
    ]);
    // Ningún artefacto de un fragmento entra en `cierre` (descarga `informes-*`)
    for (const s of subidas) expect(String(s.with?.['name'])).not.toMatch(/^informes-/);
    // La medida de tamaño (TA-222) la guarda solo el fragmento que corrió tamano.e2e.ts
    const guardar = f.steps.find((p) => p.uses?.startsWith('actions/cache/save@'));
    expect(guardar?.if).toContain("github.event_name == 'push'");
    expect(guardar?.if).toContain("hashFiles('test-results/tamanos-main/tamanos.json') != ''");
  });

  it('workflows: el job e2e une los blobs, pasa solo con todos los fragmentos en verde y sube informes-e2e como antes (CH-231)', () => {
    const pasos = job('e2e').steps;
    const bajar = pasos.findIndex((p) => p.uses?.startsWith('actions/download-artifact@'));
    const unir = pasos.findIndex((p) => p.run === 'pnpm ci:e2e-unir');
    expect(pasos[bajar]?.with).toMatchObject({
      pattern: 'e2e-blob-*',
      'merge-multiple': true,
      path: 'test-results/e2e-blob',
    });
    expect(bajar).toBeLessThan(unir);
    expect(pasos[unir]?.env?.['FINN_E2E_FRAGMENTOS']).toBe('${{ needs.e2e-fragmento.result }}');
    // El filtro usado queda en e2e-completa.json para que main sepa si la E2E fue completa (TA-555)
    expect(pasos[unir]?.env?.['FINN_E2E_GREP']).toBe('${{ needs.rapido.outputs.grep_e2e }}');
    const subir = pasos.find((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(subir?.with).toMatchObject({ name: 'informes-e2e', path: 'apps/web/test-results/' });
    expect(subir?.if).toBe('${{ !cancelled() }}');
    expect(pkg.scripts['ci:e2e-unir']).toBe('node tools/ci/afecta.mjs e2e-unir');
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
    for (const n of ['e2e-fragmento', 'e2e', 'cierre'])
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

  it('workflows: un cambio en servidor/ corre integracion: PRU-SEG-ACCESO-001 es la barrera de las acciones de cada ficha', () => {
    const d = decidir('pull_request', 'true', ['apps/web/src/servidor/acciones/compras.ts']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true });
  });

  it('workflows: PR en borrador que solo toca tools/humo corre integracion (PRU-SEG-OPER-103 y 106 viven ahí), no e2e', () => {
    const d = decidir('pull_request', 'true', ['tools/humo/patron.ts']);
    expect(d).toMatchObject({ afecta_db: true, integracion: true, e2e: false });
  });

  it('workflows: PR en borrador que solo toca tools/respaldo corre integracion, no e2e (CH-58)', () => {
    const d = decidir('pull_request', 'true', ['tools/respaldo/restaurar.sh']);
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

  it('workflows: los recortes de un estado guardado antes de CH-46 no se aplican, ni en synchronize (CH-61)', () => {
    conModo('202610', ['e2e-pr-al-pasar-a-listo', 'nocturno-semanal']);
    const web = ['apps/web/src/x.tsx'];
    expect(decidir('pull_request', 'false', web, 'synchronize')).toMatchObject({ e2e: true });
    conModo('202610', ['e2e-pr-al-pasar-a-listo', 'e2e-pr-suspendido']);
    expect(decidir('pull_request', 'false', web, 'ready_for_review')).toMatchObject({ e2e: true });
    expect(decidir('push', '', web, '')).toMatchObject({ e2e: true });
  });

  it('workflows: el PR que pasa una ficha a terminada corre e2e y cierre, en borrador y sin tocar la web (07 §13.2)', () => {
    mkdirSync(join(cwd, 'pruebas'));
    writeFileSync(join(cwd, 'pruebas', 'features.json'), JSON.stringify({ 'FT-01': 'terminada' }));
    const d = decidir('pull_request', 'true', ['pruebas/features.json']);
    expect(d).toMatchObject({ afecta_web: false, e2e: true, cierre: true });
  });

  it('PRU-SEG-OPER-111 [M15] CH-70: en local, una ficha que se cierra corre e2e sin tocar la web; sin fichas que se cierran, solo con afecta_web', () => {
    expect(decidir('', '', ['docs/x.md'])).toMatchObject({ e2e: false, cierre: false });
    expect(decidir('', '', ['apps/web/src/x.tsx'])).toMatchObject({ e2e: true, cierre: false });
    mkdirSync(join(cwd, 'pruebas'));
    writeFileSync(join(cwd, 'pruebas', 'features.json'), JSON.stringify({ 'FT-01': 'terminada' }));
    const d = decidir('', '', ['pruebas/features.json']);
    expect(d).toMatchObject({ afecta_web: false, e2e: true, cierre: true });
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
    expect(corto('apps/web/src/x.tsx', 'docs/07-pruebas.md')).toBe(false);
    expect(corto()).toBe(false);
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

  it('workflows: en main, con la corrida que dejó ci:reutiliza-e2e, e2e=false y reutiliza_e2e=<run_id>; en PR o con un id inválido, nada (TA-555)', () => {
    const conReutiliza = (contenido: string): void => {
      const f = join(cwd, 'test-results', 'reutiliza-e2e.json');
      mkdirSync(dirname(f), { recursive: true });
      writeFileSync(f, contenido);
    };
    expect(decidir('push', '', ['docs/x.md'])).toMatchObject({ e2e: true, reutiliza_e2e: '' });
    conReutiliza(JSON.stringify({ reutiliza: true, run_id: 4242 }));
    expect(decidir('push', '', ['apps/web/src/x.tsx'])).toMatchObject({
      integracion: true,
      e2e: false,
      cierre: true,
      reutiliza_e2e: '4242',
    });
    expect(decidir('pull_request', 'false', ['apps/web/src/x.tsx'])).toMatchObject({
      e2e: true,
      reutiliza_e2e: '',
    });
    conReutiliza(JSON.stringify({ run_id: '42; rm -rf' }));
    expect(decidir('push', '', ['docs/x.md'])).toMatchObject({ e2e: true, reutiliza_e2e: '' });
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
