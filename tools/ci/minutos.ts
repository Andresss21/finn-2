// tools/ci/minutos.ts — M4 sin token personal (TA-013; 07 §6.5, §6.6, §32.2, §32.3; DP-12, DP-36, P7-14, CH-02, CH-46).
// CH-46: el repositorio es público y los runners estándar son gratis; mide y publica el uso, pero la cuota no decide.
// Portado de docs/anexos/07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/ci/minutos.ts (V7-07), con la
// reserva fija, la proyección sin M5, el uso por job y el estado que restauran ci.yml y nocturno.yml.
//   node tools/ci/minutos.ts calcular  primer paso del nocturno: suma los jobs del mes con el GITHUB_TOKEN del job
//                                      (`actions: read`), decide el modo y escribe ESTADO y USO (artefacto minutos-AAAAMM)
//   node tools/ci/minutos.ts rapido    en `rapido`: el aviso de la reserva y FINN_REN_ROJO (más de 7 días falla)
// Solo sintaxis que Node 24 borra sin transformar. Las funciones exportadas reciben `hoy`: las pruebas no usan el reloj.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Job {
  name?: string;
  started_at: string | null;
  completed_at: string | null;
  conclusion?: string | null;
  labels?: string[];
}
// Orden de recorte de §32.3. Ninguno nombra `respaldo` ni `restauracion`: no hay forma de recortarlos.
export type Recorte =
  'e2e-pr-al-pasar-a-listo' | 'nocturno-semanal' | 'e2e-pr-suspendido' | 'nocturno-suspendido';
export interface Estado {
  mes: string; // AAAAMM
  modo: 'normal' | 'ahorro';
  recortes: Recorte[];
  amenazada: boolean;
  usados: number;
  proyeccion: number;
  proyeccion_sin_m5: [number, number];
  reserva_pendiente: number;
  aviso_reserva: number | null; // déficit que queda después de todos los recortes (§32.3: el usuario decide)
  nocturno_ultimo: string | null; // última vez que el nocturno decidió correr sus suites
  ren_rojo_desde: string | null; // FINN_REN_ROJO (§6.6); lo fija el job REN del nocturno cuando exista
}
export type Api = (ruta: string) => Promise<unknown>;

export const ESTADO = 'test-results/ci-modo/ci-modo.json';
const USO = 'test-results/minutos';
const DIA = 86_400_000;
const [M5_MIN, M5_MAX] = [60, 90]; // 32.2: sin M5, un arranque más por corrida

const mesDe = (hoy: Date): string => hoy.toISOString().slice(0, 7).replace('-', '');
const diasDelMes = (hoy: Date): number =>
  new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0)).getUTCDate();

/** 6.4: cada job se cobra redondeado hacia arriba al minuto; sin terminar o en un runner propio, 0. */
export const minutosJob = (j: Job): number =>
  !j.started_at || !j.completed_at || j.labels?.includes('self-hosted')
    ? 0
    : Math.max(0, Math.ceil((Date.parse(j.completed_at) - Date.parse(j.started_at)) / 60_000));
export const minutosCobrados = (jobs: Job[]): number => jobs.reduce((s, j) => s + minutosJob(j), 0);

/** §32.3: respaldos que faltan × 3 + restauraciones que faltan × 5; 0 mientras no exista producción. */
export function reservaPendiente(hoy: Date, produccion: boolean, cron: string | null): number {
  if (!produccion) return 0;
  const [dia, dias] = [hoy.getUTCDate(), diasDelMes(hoy)];
  const [, , dom = '*', , dow = '*'] = (cron ?? '').trim().split(/\s+/);
  const en = (campo: string, n: number): boolean => campo.split(',').map(Number).includes(n);
  let restauraciones = 0;
  for (let d = dia + 1; d <= dias; d++) {
    const semana = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), d)).getUTCDay();
    if (dow !== '*' ? en(dow, semana) : en(dom, d)) restauraciones++;
  }
  // El respaldo de hoy (07:30 UTC) ya corrió cuando corre el nocturno (08:15 UTC)
  return (dias - dia) * 3 + restauraciones * 5;
}

/** Proyección lineal y reserva pendiente (6.5, §32.3). CH-46: siempre normal; lo que traiga `anterior` no se hereda. */
export function decidir(
  usados: number,
  hoy: Date,
  reserva: number,
  anterior: Partial<Estado> | null,
): Estado {
  const proyeccion = Math.round((usados * diasDelMes(hoy)) / hoy.getUTCDate());
  return {
    mes: mesDe(hoy),
    modo: 'normal',
    recortes: [],
    amenazada: false,
    usados,
    proyeccion,
    proyeccion_sin_m5: [proyeccion + M5_MIN, proyeccion + M5_MAX],
    reserva_pendiente: reserva,
    aviso_reserva: null,
    nocturno_ultimo: anterior?.nocturno_ultimo ?? null,
    ren_rojo_desde: anterior?.ren_rojo_desde ?? null,
  };
}

/** El modo vale solo en su mes: sin entrada del mes (principio de mes o caché expirada), normal. */
export const recortesVigentes = (e: Estado | null, hoy: Date): Recorte[] =>
  e && e.mes === mesDe(hoy) ? e.recortes : [];

/** CH-46: con el repositorio público la cuota no decide. Si vuelve a ser privado, se reabre con un CH (07 §32.3). */
export const CUOTA_RECORTA = false;

/** Lo que se aplica de verdad (CH-60): un estado guardado antes de CH-46 no recorta aunque sea del mes en curso. */
export const recortesAplicables = (
  e: Estado | null,
  hoy: Date,
  cuotaRecorta: boolean = CUOTA_RECORTA,
): Recorte[] => (cuotaRecorta ? recortesVigentes(e, hoy) : []);

/** ci.yml: en ahorro, `e2e` de PR una sola vez, al pasar a listo; suspendido, nunca. `main` no pasa por aquí. */
export const e2eDePr = (r: Recorte[], accion: string): boolean =>
  !r.includes('e2e-pr-suspendido') &&
  (!r.includes('e2e-pr-al-pasar-a-listo') || accion === 'ready_for_review' || accion === 'opened');

/** nocturno.yml: a mano siempre; si no, solo si main cambió, y en ahorro una vez por semana (6.5). */
export function correrNocturno(e: Estado, hoy: Date, manual: boolean, cambio: boolean): boolean {
  if (manual) return true;
  if (!cambio || e.recortes.includes('nocturno-suspendido')) return false;
  const desde = e.nocturno_ultimo ? (hoy.getTime() - Date.parse(e.nocturno_ultimo)) / DIA : 99;
  return !e.recortes.includes('nocturno-semanal') || desde >= 6;
}

/** §6.6: un presupuesto de tiempo superado no bloquea; con FINN_REN_ROJO activo más de 7 días, `rapido` falla. */
export function renRojo(desde: string | null, hoy: Date): string | null {
  if (!desde || (hoy.getTime() - Date.parse(desde)) / DIA <= 7) return null;
  return `FINN_REN_ROJO activo desde ${desde}: más de 7 días. Corregir el rendimiento o aprobar un CT (07 §6.6)`;
}

/** Los jobs de las corridas creadas desde el día 1 del mes, con su uso cobrado (CH-02: artefacto, no la app). */
export async function sumarMes(api: Api, repo: string, hoy: Date) {
  const desde = `${hoy.toISOString().slice(0, 8)}01`;
  const jobs: { run: number; workflow: string; job: string; minutos: number }[] = [];
  for (let p = 1; ; p++) {
    const ruta = `/repos/${repo}/actions/runs?created=%3E%3D${desde}&per_page=100&page=${p}`;
    const { workflow_runs: runs } = (await api(ruta)) as {
      workflow_runs: { id: number; name: string }[];
    };
    for (const run of runs) {
      const r = (await api(`/repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`)) as {
        jobs: Job[];
      };
      for (const j of r.jobs)
        jobs.push({ run: run.id, workflow: run.name, job: j.name ?? '', minutos: minutosJob(j) });
    }
    if (runs.length < 100) break;
  }
  return { usados: jobs.reduce((s, j) => s + j.minutos, 0), jobs };
}

/** P7-14: main cambió desde la última corrida del nocturno en la que una suite terminó en verde. */
async function mainCambio(api: Api, repo: string, sha: string): Promise<boolean> {
  const ruta = `/repos/${repo}/actions/workflows/nocturno.yml/runs?branch=main&status=success&per_page=20`;
  const { workflow_runs: runs } = (await api(ruta)) as {
    workflow_runs: { id: number; head_sha: string }[];
  };
  for (const run of runs) {
    const { jobs } = (await api(`/repos/${repo}/actions/runs/${run.id}/jobs`)) as { jobs: Job[] };
    if (jobs.some((j) => j.name !== 'minutos' && j.conclusion === 'success'))
      return run.head_sha !== sha;
  }
  return true;
}

const leer = (f: string): string | null => (existsSync(f) ? readFileSync(f, 'utf8') : null);
function escribir(f: string, datos: unknown): void {
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, `${JSON.stringify(datos, null, 2)}\n`);
}

if (import.meta.main) {
  const env = (k: string): string => process.env[k] ?? '';
  const [cmd = ''] = process.argv.slice(2);
  const hoy = new Date();
  const texto = leer(ESTADO);
  const anterior = texto ? (JSON.parse(texto) as Estado) : null;
  if (cmd === 'calcular') {
    const [repo, token] = [env('GITHUB_REPOSITORY'), env('GITHUB_TOKEN')];
    const api: Api = async (ruta) => {
      const r = await fetch(`https://api.github.com${ruta}`, {
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
        },
      });
      if (!r.ok) throw new Error(`minutos: ${ruta} respondió ${r.status}`);
      return r.json();
    };
    const { usados, jobs } = await sumarMes(api, repo, hoy);
    const cron = /cron:\s*['"]([^'"]+)['"]/.exec(leer('.github/workflows/restauracion.yml') ?? '');
    const reserva = reservaPendiente(
      hoy,
      existsSync('.github/workflows/respaldo.yml'),
      cron?.[1] ?? null,
    );
    const e = decidir(usados, hoy, reserva, anterior);
    const manual = env('GITHUB_EVENT_NAME') === 'workflow_dispatch';
    const correr = correrNocturno(
      e,
      hoy,
      manual,
      manual || (await mainCambio(api, repo, env('GITHUB_SHA'))),
    );
    if (correr) e.nocturno_ultimo = hoy.toISOString();
    escribir(ESTADO, e);
    escribir(`${USO}/minutos-${e.mes}.json`, { calculado: hoy.toISOString(), ...e, jobs });
    console.log(`minutos: ${JSON.stringify({ ...e, correr })}`);
    if (env('GITHUB_OUTPUT'))
      appendFileSync(env('GITHUB_OUTPUT'), `mes=${e.mes}\nmodo=${e.modo}\ncorrer=${correr}\n`);
  } else if (cmd === 'rapido') {
    const r = recortesAplicables(anterior, hoy);
    console.log(
      `minutos: modo ${r.length ? 'ahorro' : 'normal'}${r.length ? ` (${r.join(', ')})` : ''}`,
    );
    const k = anterior && r.length ? anterior.aviso_reserva : null;
    if (k) console.log(`::warning::La reserva del respaldo está en riesgo: ${k} minutos`);
    const rojo = renRojo(env('FINN_REN_ROJO') || anterior?.ren_rojo_desde || null, hoy);
    if (rojo) {
      console.error(rojo);
      process.exit(1);
    }
  } else {
    console.error(`minutos: comando desconocido "${cmd}" (calcular, rapido)`);
    process.exit(2);
  }
}
