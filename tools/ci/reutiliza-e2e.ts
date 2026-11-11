// tools/ci/reutiliza-e2e.ts — `main` sin repetir la E2E de un PR con el mismo árbol (TA-555; CH-231 c, CH-237; 07 §6.1).
//   node tools/ci/reutiliza-e2e.ts   `pnpm ci:reutiliza-e2e`, en `rapido` de `main` antes de `ci:rapido`. Si el commit es el
//                                    squash de un PR cuya cabeza H tiene su mismo árbol, contiene el `main` anterior y
//                                    pasó su CI entera (e2e y cierre en success) con la E2E completa, deja REUTILIZA con
//                                    el run_id; afecta.mjs publica entonces e2e=false y reutiliza_e2e=<run_id>.
// Ante cualquier duda (otro árbol, `main` movido, E2E filtrada, corrida roja, artefacto vencido, API que falla) no deja
// nada y `main` corre todo como antes. Nunca falla el job: la duda solo cuesta minutos.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const REUTILIZA = 'test-results/reutiliza-e2e.json';
/** Lo deja el job `e2e` (`ci:e2e-unir`) en `informes-e2e`: el filtro usado y cuántas pruebas tuvo el informe unido. */
export const COMPLETA = 'e2e-completa.json';
// `cierre` de `main` baja el artefacto unos minutos después: con menos margen que esto, mejor correr todo
const MARGEN_MS = 2 * 60 * 60 * 1000;

export type Api = (ruta: string) => Promise<unknown>;
export type Git = (...args: string[]) => { ok: boolean; salida: string };
export interface Entorno {
  repo: string;
  sha: string;
  api: Api;
  git: Git;
  /** El contenido de COMPLETA dentro del zip del artefacto. */
  artefacto: (url: string) => Promise<string>;
  ahora: number;
}
export type Decision =
  | { reutiliza: true; run_id: number; pr: number; cabeza: string; pruebas: number }
  | { reutiliza: false; motivo: string };
export interface Registro {
  filtro: string;
  pruebas: number;
  fragmentos: string;
}

interface Pr {
  number: number;
  merged_at: string | null;
  merge_commit_sha: string | null;
  base: { ref: string };
  head: { sha: string };
}
interface Corrida {
  id: number;
  status: string;
  conclusion: string | null;
  created_at: string;
}
interface Artefacto {
  name: string;
  expired: boolean;
  expires_at: string;
  archive_download_url: string;
}

/** El registro de la E2E de una corrida a partir del informe JSON unido de Playwright. */
export function registroE2e(informe: unknown, filtro: string, fragmentos: string): Registro {
  const s = ((informe ?? {}) as { stats?: Record<string, unknown> }).stats ?? {};
  const pruebas = ['expected', 'unexpected', 'flaky', 'skipped'].reduce(
    (t, k) => t + (Number(s[k]) || 0),
    0,
  );
  return { filtro, pruebas, fragmentos };
}

/** La suite completa: sin filtro `-g`, con pruebas y con todos los fragmentos en verde. */
export function esCompleta(r: unknown): boolean {
  const x = (r ?? {}) as Partial<Registro>;
  return (
    x.filtro === 'todas' &&
    x.fragmentos === 'success' &&
    Number.isInteger(x.pruebas) &&
    (x.pruebas ?? 0) > 0
  );
}

/** CH-239: la última E2E completa de `main` (`{ sha }` e `informe.json` al lado), que guarda `cierre` en la caché. */
export const BASE_E2E = 'test-results/e2e-base/base.json';
const VIGENCIA_BASE_S = 7 * 24 * 3600;

/** El `sha` de un registro de BASE_E2E si es un commit completo; si no, ''. */
export function shaDe(registro: unknown): string {
  const sha = (registro as { sha?: unknown } | null)?.sha;
  return typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha) ? sha : '';
}

/** CH-239: la base de la clase del diff en `main`: el commit de la última E2E completa, si es ancestro de HEAD y su
 * commit tiene a lo sumo 7 días menos que el de HEAD (sin reloj). Si no, '' y `main` corre la completa. */
export function baseE2e(registro: unknown, git: Git): string {
  const sha = shaDe(registro);
  if (sha === '' || !git('merge-base', '--is-ancestor', sha, 'HEAD').ok) return '';
  const fecha = (r: string): number => {
    const x = git('log', '-1', '--format=%ct', r);
    return x.ok && /^\d+$/.test(x.salida.trim()) ? Number(x.salida.trim()) : NaN;
  };
  const dt = fecha('HEAD') - fecha(sha);
  return dt >= 0 && dt <= VIGENCIA_BASE_S ? sha : '';
}

const no = (motivo: string): Decision => ({ reutiliza: false, motivo });

export async function decidirReutilizacion(e: Entorno): Promise<Decision> {
  try {
    return await decidir(e);
  } catch (x) {
    return no(`la API, git o el artefacto fallaron: ${(x as Error).message}`);
  }
}

async function decidir({ repo, sha, api, git, artefacto, ahora }: Entorno): Promise<Decision> {
  const prs = ((await api(`/repos/${repo}/commits/${sha}/pulls`)) as Pr[]).filter(
    (p) => p.merged_at !== null && p.merge_commit_sha === sha && p.base.ref === 'main',
  );
  const pr = prs[0];
  if (prs.length !== 1 || pr === undefined)
    return no(`el commit no es el merge de un único PR a main (${prs.length})`);
  const [n, h] = [pr.number, pr.head.sha];
  const ref = `refs/finn/pr-${n}`;
  if (!git('fetch', '--no-tags', '--quiet', 'origin', `+refs/pull/${n}/head:${ref}`).ok)
    return no(`no se pudo traer refs/pull/${n}/head`);
  const rev = (r: string): string => {
    const x = git('rev-parse', '--verify', '--quiet', r);
    return x.ok ? x.salida.trim() : '';
  };
  if (!/^[0-9a-f]{40}$/.test(h) || rev(ref) !== h)
    return no(`refs/pull/${n}/head no es la cabeza ${h}`);
  // (1) el mismo árbol; (2) sin cambios de `main` entre medio: el merge que probó la CI del PR tiene el árbol de H
  const arbol = rev('HEAD^{tree}');
  if (arbol === '' || arbol !== rev(`${h}^{tree}`))
    return no(`el árbol de main no es el de la cabeza de #${n}`);
  if (!git('merge-base', '--is-ancestor', 'HEAD^1', h).ok)
    return no(`main se movió: HEAD^1 no es ancestro de la cabeza de #${n}`);
  // (3) la última corrida de ci.yml del PR para H, entera en verde, con e2e y cierre en success
  const { workflow_runs: corridas } = (await api(
    `/repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${h}&event=pull_request&per_page=100`,
  )) as { workflow_runs: Corrida[] };
  const run = [...corridas].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (run === undefined) return no(`ninguna corrida de ci.yml para la cabeza de #${n}`);
  if (run.status !== 'completed' || run.conclusion !== 'success')
    return no(`la última corrida de #${n} (${run.id}) no terminó en success`);
  const { jobs } = (await api(
    `/repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`,
  )) as { jobs: { name: string; conclusion: string | null }[] };
  for (const j of ['e2e', 'cierre'])
    if (jobs.find((x) => x.name === j)?.conclusion !== 'success')
      return no(`${j} de la corrida ${run.id} no está en success`);
  // (4) su E2E fue la suite completa, y su informe sigue ahí para `cierre` (M15)
  const { artifacts } = (await api(
    `/repos/${repo}/actions/runs/${run.id}/artifacts?name=informes-e2e&per_page=100`,
  )) as { artifacts: Artefacto[] };
  const a = artifacts.filter((x) => x.name === 'informes-e2e');
  if (a.length !== 1 || a[0] === undefined || a[0].expired)
    return no(`informes-e2e de la corrida ${run.id} no está`);
  if (!(Date.parse(a[0].expires_at) - ahora >= MARGEN_MS))
    return no(`informes-e2e de la corrida ${run.id} vence antes de que lo lea cierre`);
  const registro: unknown = JSON.parse(await artefacto(a[0].archive_download_url));
  if (!esCompleta(registro)) return no(`la E2E de la corrida ${run.id} no fue la suite completa`);
  return {
    reutiliza: true,
    run_id: run.id,
    pr: n,
    cabeza: h,
    pruebas: (registro as Registro).pruebas,
  };
}

if (import.meta.main) {
  const env = (k: string): string => process.env[k] ?? '';
  const [repo, token, sha] = [env('GITHUB_REPOSITORY'), env('GITHUB_TOKEN'), env('GITHUB_SHA')];
  const cabeceras = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };
  const api: Api = async (ruta) => {
    const r = await fetch(`https://api.github.com${ruta}`, { headers: cabeceras });
    if (!r.ok) throw new Error(`${ruta} respondió ${r.status}`);
    return r.json();
  };
  const git: Git = (...args) => {
    const r = spawnSync('git', args, { encoding: 'utf8' });
    return { ok: r.status === 0, salida: r.stdout };
  };
  const artefacto = async (url: string): Promise<string> => {
    const r = await fetch(url, { headers: cabeceras });
    if (!r.ok) throw new Error(`informes-e2e respondió ${r.status}`);
    const dir = mkdtempSync(join(tmpdir(), 'finn-informes-e2e-'));
    try {
      const zip = join(dir, 'informes-e2e.zip');
      writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
      const u = spawnSync('unzip', ['-p', zip, COMPLETA], { encoding: 'utf8' });
      if (u.status !== 0) throw new Error(`${COMPLETA} no está en informes-e2e`);
      return u.stdout;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const d =
    repo !== '' && token !== '' && sha !== ''
      ? await decidirReutilizacion({ repo, sha, api, git, artefacto, ahora: Date.now() })
      : no('faltan GITHUB_REPOSITORY, GITHUB_TOKEN o GITHUB_SHA');
  rmSync(REUTILIZA, { force: true });
  if (d.reutiliza) {
    mkdirSync(dirname(REUTILIZA), { recursive: true });
    writeFileSync(REUTILIZA, `${JSON.stringify(d)}\n`);
    console.log(
      `reutiliza-e2e: main no repite la E2E: usa la corrida ${d.run_id} de #${d.pr} (${d.pruebas} pruebas, cabeza ${d.cabeza})`,
    );
  } else console.log(`reutiliza-e2e: main corre la E2E completa: ${d.motivo}`);
}
