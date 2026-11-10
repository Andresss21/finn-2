// workflows: reutilización de la E2E de un PR en `main` (TA-555; CH-231 c, CH-237; 07 §6.1). La API de GitHub, git y el
// artefacto `informes-e2e` están simulados: árbol igual con la CI del PR entera en verde y la E2E completa reutiliza; con
// cualquier otra cosa (árbol distinto, `main` movido, E2E filtrada, `cierre` sin correr, corrida roja, artefacto vencido
// o ausente, API que falla) `main` corre todo como antes.
import { describe, expect, it } from 'vitest';
import {
  decidirReutilizacion,
  esCompleta,
  registroE2e,
  type Api,
  type Entorno,
  type Git,
} from './reutiliza-e2e.ts';

const REPO = 'finn/finn';
const SHA = 'a'.repeat(40);
const H = 'b'.repeat(40);
const ARBOL = 'c'.repeat(40);
const RUN = 4242;
const AHORA = Date.parse('2026-11-10T12:00:00Z');

interface Mundo {
  prs: unknown[];
  arbolMain: string;
  arbolH: string;
  ancestro: boolean;
  traer: boolean;
  refCabeza: string;
  runs: unknown[];
  jobs: { name: string; conclusion: string | null }[];
  artefactos: unknown[];
  completa: string;
  falla: string;
}

const mundo = (cambios: Partial<Mundo> = {}): Mundo => ({
  prs: [
    {
      number: 77,
      merged_at: '2026-11-10T11:50:00Z',
      merge_commit_sha: SHA,
      base: { ref: 'main' },
      head: { sha: H },
    },
  ],
  arbolMain: ARBOL,
  arbolH: ARBOL,
  ancestro: true,
  traer: true,
  refCabeza: H,
  runs: [
    { id: RUN, status: 'completed', conclusion: 'success', created_at: '2026-11-10T11:20:00Z' },
    { id: 4100, status: 'completed', conclusion: 'failure', created_at: '2026-11-10T10:00:00Z' },
  ],
  jobs: [
    { name: 'rapido', conclusion: 'success' },
    { name: 'e2e-fragmento-1', conclusion: 'success' },
    { name: 'e2e', conclusion: 'success' },
    { name: 'cierre', conclusion: 'success' },
  ],
  artefactos: [
    {
      name: 'informes-e2e',
      expired: false,
      expires_at: '2026-11-13T11:20:00Z',
      archive_download_url: 'https://api.github.com/x/zip',
    },
  ],
  completa: JSON.stringify({ filtro: 'todas', pruebas: 564, fragmentos: 'success' }),
  falla: '',
  ...cambios,
});

const entorno = (m: Mundo): Entorno => {
  const api: Api = (ruta) => {
    if (m.falla !== '' && ruta.includes(m.falla)) return Promise.reject(new Error('503'));
    if (ruta === `/repos/${REPO}/commits/${SHA}/pulls`) return Promise.resolve(m.prs);
    if (
      ruta.startsWith(
        `/repos/${REPO}/actions/workflows/ci.yml/runs?head_sha=${H}&event=pull_request`,
      )
    )
      return Promise.resolve({ workflow_runs: m.runs });
    if (ruta.startsWith(`/repos/${REPO}/actions/runs/${RUN}/jobs?filter=latest`))
      return Promise.resolve({ jobs: m.jobs });
    if (ruta.startsWith(`/repos/${REPO}/actions/runs/${RUN}/artifacts?name=informes-e2e`))
      return Promise.resolve({ artifacts: m.artefactos });
    return Promise.reject(new Error(`ruta inesperada ${ruta}`));
  };
  const git: Git = (...a) => {
    const s = a.join(' ');
    if (s.startsWith('fetch '))
      return { ok: m.traer && s.includes('refs/pull/77/head'), salida: '' };
    if (s.endsWith('refs/finn/pr-77')) return { ok: true, salida: `${m.refCabeza}\n` };
    if (s.endsWith('HEAD^{tree}')) return { ok: true, salida: `${m.arbolMain}\n` };
    if (s.endsWith(`${H}^{tree}`)) return { ok: true, salida: `${m.arbolH}\n` };
    if (s === `merge-base --is-ancestor HEAD^1 ${H}`) return { ok: m.ancestro, salida: '' };
    return { ok: false, salida: '' };
  };
  const artefacto = (url: string): Promise<string> =>
    m.falla === 'zip' || url === ''
      ? Promise.reject(new Error('sin e2e-completa.json'))
      : Promise.resolve(m.completa);
  return { repo: REPO, sha: SHA, api, git, artefacto, ahora: AHORA };
};

const decide = (c: Partial<Mundo> = {}) => decidirReutilizacion(entorno(mundo(c)));
const noReutiliza = async (c: Partial<Mundo>, motivo: RegExp): Promise<void> => {
  const d = await decide(c);
  expect(d.reutiliza).toBe(false);
  if (!d.reutiliza) expect(d.motivo).toMatch(motivo);
};

describe('workflows: reutiliza-e2e en main (TA-555, CH-231 c)', () => {
  it('workflows: árbol igual, main anterior dentro de la cabeza y CI del PR entera en verde con E2E completa: reutiliza esa corrida', async () => {
    expect(await decide()).toEqual({
      reutiliza: true,
      run_id: RUN,
      pr: 77,
      cabeza: H,
      pruebas: 564,
    });
  });

  it('workflows: árbol distinto de la cabeza del PR no reutiliza', async () => {
    await noReutiliza({ arbolH: 'd'.repeat(40) }, /árbol/);
    await noReutiliza({ arbolMain: '' }, /árbol/);
  });

  it('workflows: HEAD^1 que no es ancestro de la cabeza (main se movió) no reutiliza', async () => {
    await noReutiliza({ ancestro: false }, /main se movió/);
  });

  it('workflows: sin un único PR mergeado a main con este commit, o sin poder traer su cabeza, no reutiliza', async () => {
    await noReutiliza({ prs: [] }, /único PR/);
    const pr = mundo().prs[0] as Record<string, unknown>;
    await noReutiliza({ prs: [pr, { ...pr, number: 78 }] }, /único PR/);
    await noReutiliza({ prs: [{ ...pr, merge_commit_sha: H }] }, /único PR/);
    await noReutiliza({ prs: [{ ...pr, base: { ref: 'otra' } }] }, /único PR/);
    await noReutiliza({ prs: [{ ...pr, merged_at: null }] }, /único PR/);
    await noReutiliza({ traer: false }, /no se pudo traer/);
    await noReutiliza({ refCabeza: 'e'.repeat(40) }, /no es la cabeza/);
  });

  it('workflows: E2E filtrada, sin pruebas, con fragmentos rojos o sin registro no reutiliza', async () => {
    const c = (x: unknown) => ({ completa: JSON.stringify(x) });
    await noReutiliza(
      c({ filtro: 'PRU-E2E-INI-001', pruebas: 12, fragmentos: 'success' }),
      /completa/,
    );
    await noReutiliza(c({ filtro: '', pruebas: 564, fragmentos: 'success' }), /completa/);
    await noReutiliza(c({ filtro: 'todas', pruebas: 0, fragmentos: 'success' }), /completa/);
    await noReutiliza(c({ filtro: 'todas', pruebas: 564, fragmentos: 'failure' }), /completa/);
    await noReutiliza({ completa: 'no es json' }, /fallaron/);
    await noReutiliza({ falla: 'zip' }, /fallaron/);
  });

  it('workflows: cierre sin correr o e2e que no está en success en la corrida del PR no reutiliza', async () => {
    const jobs = mundo().jobs;
    const con = (n: string, c: string | null) =>
      jobs.map((j) => (j.name === n ? { ...j, conclusion: c } : j));
    await noReutiliza({ jobs: con('cierre', 'skipped') }, /cierre/);
    await noReutiliza({ jobs: jobs.filter((j) => j.name !== 'cierre') }, /cierre/);
    await noReutiliza({ jobs: con('e2e', 'skipped') }, /e2e/);
    await noReutiliza({ jobs: con('e2e', 'failure') }, /e2e/);
  });

  it('workflows: la última corrida del PR roja, cancelada o en curso no reutiliza, aunque una anterior haya pasado', async () => {
    const base = { id: RUN, status: 'completed', created_at: '2026-11-10T11:20:00Z' };
    await noReutiliza({ runs: [{ ...base, conclusion: 'failure' }] }, /success/);
    await noReutiliza({ runs: [{ ...base, status: 'in_progress', conclusion: null }] }, /success/);
    await noReutiliza(
      {
        runs: [
          { ...base, conclusion: 'success' },
          { ...base, id: 5000, conclusion: 'cancelled', created_at: '2026-11-10T11:40:00Z' },
        ],
      },
      /success/,
    );
    await noReutiliza({ runs: [] }, /ninguna corrida/);
  });

  it('workflows: informes-e2e vencido, por vencer o ausente no reutiliza', async () => {
    const a = mundo().artefactos[0] as Record<string, unknown>;
    await noReutiliza({ artefactos: [] }, /informes-e2e/);
    await noReutiliza({ artefactos: [{ ...a, expired: true }] }, /informes-e2e/);
    await noReutiliza(
      { artefactos: [{ ...a, expires_at: '2026-11-10T13:00:00Z' }] },
      /informes-e2e/,
    );
  });

  it('workflows: si la API falla en cualquier consulta, no reutiliza', async () => {
    for (const f of ['/pulls', '/runs?head_sha', '/jobs', '/artifacts'])
      await noReutiliza({ falla: f }, /fallaron/);
  });

  it('workflows: el registro de la E2E cuenta las pruebas del informe unido y solo es completo sin filtro', () => {
    const informe = { stats: { expected: 550, unexpected: 0, flaky: 2, skipped: 12 } };
    const r = registroE2e(informe, 'todas', 'success');
    expect(r).toEqual({ filtro: 'todas', pruebas: 564, fragmentos: 'success' });
    expect(esCompleta(r)).toBe(true);
    expect(esCompleta(registroE2e(informe, 'PRU-E2E-INI-001', 'success'))).toBe(false);
    expect(esCompleta(registroE2e({}, 'todas', 'success'))).toBe(false);
    expect(esCompleta(registroE2e(informe, 'todas', 'failure'))).toBe(false);
    expect(esCompleta(null)).toBe(false);
  });
});
