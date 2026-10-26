// tools/ci/afecta.mjs — qué toca el diff y qué corre (TA-012; 07 §6.1, §6.5 M1 a M3, §32.2 M5; 08 DT-07; DP-34).
//   node tools/ci/afecta.mjs [--archivos a,b]  JSON con afecta_db, afecta_web, integracion, e2e y cierre
//   node tools/ci/afecta.mjs rapido            `pnpm ci:rapido`: controles fijos, matriz y suites de `rapido`
//   node tools/ci/afecta.mjs e2e               `pnpm ci:e2e`: en main la suite completa de `movil`; si no, las afectadas
//   node tools/ci/afecta.mjs local             `pnpm ci:local` (DT-07): rapido y, según el diff, integracion y e2e
// Entorno: FINN_EVENTO (pull_request | push; vacío en local), FINN_BORRADOR (true | false), FINN_BASE (por defecto
// origin/main; en main, el commit anterior al push). Con GITHUB_OUTPUT, las decisiones quedan como salidas del paso.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { afectadas } from '../pruebas/afectadas.ts';
import { cargarEntradas, verificar } from '../pruebas/matriz.ts';
import { cambiosDeEstado } from '../pruebas/resumen.ts';

// La base (integracion) y la web (e2e). Un cambio de CI cuenta como los dos: así el workflow se prueba entero.
const CI = /^(\.github\/|tools\/ci\/|pnpm-lock\.yaml$|infra\/|supabase\/)/;
const DB =
  /^(packages\/(db|aplicacion)\/|tools\/db\/|apps\/web\/src\/app\/api\/|vitest\.config\.ts$)/;
const WEB = /^(apps\/web\/|packages\/(?!.*\.test\.ts$))/;
const NAVEGADORES = 'pnpm exec playwright install --with-deps chromium';

const env = (k) => process.env[k] ?? '';
const [enCi, evento, windows] = [
  env('CI') !== '',
  env('FINN_EVENTO'),
  process.platform === 'win32',
];
const git = (...args) => {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, salida: r.stdout ?? '' };
};

/** FINN_BASE si existe como commit (en main, `github.event.before`); si no, el commit anterior. */
function base() {
  const b = env('FINN_BASE') || 'origin/main';
  return !/^0+$/.test(b) && git('rev-parse', '--verify', '--quiet', `${b}^{commit}`).ok
    ? b
    : 'HEAD~1';
}

/** En CI, el diff del PR o del push; en local, también lo que todavía no está confirmado. */
function cambiados(b) {
  const mb = git('merge-base', b, 'HEAD');
  const r = git('diff', '--name-only', evento === '' ? mb.salida.trim() : `${b}...HEAD`);
  if (!mb.ok || !r.ok)
    throw new Error(`afecta: git diff contra ${b} falló (¿falta git fetch origin?)`);
  const nuevos = evento === '' ? git('ls-files', '--others', '--exclude-standard').salida : '';
  return [...new Set(`${r.salida}\n${nuevos}`.split('\n').filter(Boolean))];
}

/** Alguna ficha pasa a `terminada` en pruebas/features.json respecto de la base (07 §22.2). */
function aTerminada(b) {
  const antes = git('show', `${b}:pruebas/features.json`);
  const f = 'pruebas/features.json';
  const ahora = JSON.parse(existsSync(f) ? readFileSync(f, 'utf8') : '{}');
  const cambios = cambiosDeEstado(JSON.parse(antes.ok ? antes.salida : '{}'), ahora);
  return cambios.some((c) => c.endsWith('→ terminada'));
}

/** M1: integracion con afecta_db o PR listo. M2: e2e en PR listo con afecta_web. En main, todo (07 §6.1). */
function decidir(archivos, b) {
  const db = archivos.some((a) => CI.test(a) || DB.test(a));
  const web = archivos.some((a) => CI.test(a) || WEB.test(a));
  const enMain = evento === 'push';
  const listo = evento === 'pull_request' && env('FINN_BORRADOR') !== 'true';
  return {
    afecta_db: db,
    afecta_web: web,
    integracion: enMain || listo || db,
    e2e: enMain || ((listo || evento === '') && web),
    cierre: enMain || aTerminada(b),
  };
}

function salidas(d) {
  const lineas = Object.entries(d).map(([k, v]) => `${k}=${v}\n`);
  if (env('GITHUB_OUTPUT') !== '') appendFileSync(env('GITHUB_OUTPUT'), lineas.join(''));
}

/** Corre los pasos `[nombre, comando]` en orden y se detiene en el primero que falla. */
function correr(pasos) {
  for (const [nombre, linea] of pasos) {
    console.log(enCi ? `::group::${nombre}` : `\n▶ ${nombre}: ${linea}`);
    const inicio = performance.now();
    const [cmd = '', ...args] = linea.split(' ');
    // pnpm es un .cmd en Windows y necesita la consola; el resto corre sin ella
    const r = spawnSync(cmd, args, { stdio: 'inherit', shell: windows && cmd === 'pnpm' });
    const s = ((performance.now() - inicio) / 1000).toFixed(1);
    if (enCi) console.log('::endgroup::');
    if (r.status !== 0) {
      console.error(`✗ ${nombre} falló (${s} s, código ${r.status ?? r.signal})`);
      return false;
    }
    console.log(`✓ ${nombre} (${s} s)`);
  }
  return true;
}

/** gitleaks sobre el diff (07 §6.1). En CI el binario es obligatorio; en local, si falta, solo avisa. */
function secretos(b) {
  if (spawnSync('gitleaks', ['version'], { stdio: 'ignore' }).status === 0) {
    const opts = '--config .gitleaks.toml --redact --no-banner -v --exit-code 1';
    return [['gitleaks', `gitleaks git --log-opts=${b}..HEAD ${opts} .`]];
  }
  if (enCi) return [['gitleaks', 'gitleaks-no-esta-instalado']];
  console.warn(
    'aviso gitleaks no está instalado: el control de secretos corre solo en CI (rapido)',
  );
  return [];
}

/** Filtro `-g` de las E2E afectadas (07 §6.1): `todas`, `^$` (ninguna) o los identificadores. */
function grepE2E(archivos) {
  const e = cargarEntradas();
  return afectadas(e, verificar(e), archivos).grepE2E ?? 'todas';
}

function rapido(archivos, b, d) {
  // CMP solo si cambió la web (07 §6.1); su Chromium sale de la caché de Playwright
  const cmp = d.afecta_web ? ' --project componentes' : '';
  const informe =
    '--reporter=default --reporter=json --outputFile.json=test-results/informes/rapido.json';
  const ok = correr([
    ['plan:verificar', 'pnpm plan:verificar'],
    ['typecheck', 'pnpm typecheck'],
    ['lint', 'pnpm lint'],
    ['formato', 'pnpm formato:comprobar'],
    ['versiones', 'node tools/pruebas/versiones.mjs'],
    ...secretos(b),
    ['C1', 'node tools/db/verificar-migraciones.mjs packages/db/prisma/migrations'],
    ['C2', 'bash tools/db/inmutabilidad.sh'],
    ['firmas', 'bash tools/pruebas/firmas.sh origin/main'],
    ['inventario', 'pnpm pruebas:listar'],
    ['matriz', 'pnpm pruebas:matriz'],
    ...(enCi && cmp ? [['navegadores', NAVEGADORES]] : []),
    [
      'pruebas',
      `node tools/pruebas/vitest.mjs --project unidad --project escenarios-motor --project contratos${cmp} ${informe}`,
    ],
  ]);
  if (ok) salidas({ grep_e2e: grepE2E(archivos) });
  return ok;
}

function e2e(archivos) {
  const grep = evento === 'push' ? 'todas' : env('FINN_E2E_GREP') || grepE2E(archivos);
  if (grep === '^$') return console.log('e2e: ninguna suite afectada por el diff') === undefined;
  // e2e.mjs pasa por la consola en Windows: ahí el `|` del filtro va entre comillas
  const filtro = grep === 'todas' ? '' : ` -g ${windows ? `"${grep}"` : grep}`;
  const navegadores = enCi ? [['navegadores', NAVEGADORES]] : [];
  return correr([...navegadores, ['e2e', `node tools/pruebas/e2e.mjs --project=movil${filtro}`]]);
}

const argv = process.argv.slice(2);
const modo = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'decidir';
const b = base();
const k = argv.indexOf('--archivos');
const archivos = k >= 0 ? (argv[k + 1] ?? '').split(',').filter(Boolean) : cambiados(b);
const d = decidir(archivos, b);
console.log(modo === 'decidir' ? JSON.stringify(d) : `afecta (base ${b}): ${JSON.stringify(d)}`);
salidas(d);

let ok = true;
if (modo === 'rapido') ok = rapido(archivos, b, d);
else if (modo === 'e2e') ok = e2e(archivos);
else if (modo === 'local') {
  ok = rapido(archivos, b, d);
  if (ok && d.afecta_db) ok = correr([['integracion', 'pnpm ci:integracion']]);
  if (ok && d.afecta_web) ok = e2e(archivos);
} else if (modo !== 'decidir') {
  console.error(`afecta: modo desconocido ${modo} (decidir, rapido, e2e, local)`);
  ok = false;
}
process.exit(ok ? 0 : 1);
