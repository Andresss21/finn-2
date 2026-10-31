// tools/ci/afecta.mjs — qué toca el diff y qué corre (TA-012; 07 §6.1, §6.5 M1 a M3, §32.2 M5; 08 DT-07; DP-34).
//   node tools/ci/afecta.mjs [--archivos a,b]  JSON con afecta_db, afecta_web, integracion, e2e y cierre
//   node tools/ci/afecta.mjs rapido            `pnpm ci:rapido`: controles fijos, matriz y suites de `rapido`
//   node tools/ci/afecta.mjs e2e               `pnpm ci:e2e`: en main la suite completa de `movil`; si no, las afectadas
//   node tools/ci/afecta.mjs local             `pnpm ci:local` (DT-07): rapido y, según el diff, integracion y e2e
//   node tools/ci/afecta.mjs nocturno          `pnpm ci:nocturno` (TA-013): las suites del nocturno que ya existen
// Entorno: FINN_EVENTO (pull_request | push; vacío en local), FINN_BORRADOR (true | false), FINN_ACCION (la acción del
// pull_request), FINN_BASE (por defecto origin/main; en main, el commit anterior al push). Con GITHUB_OUTPUT, las
// decisiones quedan como salidas del paso. M4 (07 §6.5): el modo sale del estado que ci.yml restauró de la caché.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { afectadas } from '../pruebas/afectadas.ts';
import { ESTADO, e2eDePr, recortesVigentes } from './minutos.ts';
import { cargarEntradas, verificar } from '../pruebas/matriz.ts';
import { cambiosDeEstado } from '../pruebas/resumen.ts';

// La base (integracion) y la web (e2e). Un cambio de CI cuenta como los dos: así el workflow se prueba entero.
// tools/humo/: humo.test.ts (PRU-SEG-OPER-103 y 106) vive en el proyecto `integracion` de vitest.config.ts.
// tools/respaldo/: un cambio solo en restaurar.sh también tiene que correr sus controles (CH-58).
const CI = /^(\.github\/|tools\/ci\/|pnpm-lock\.yaml$|infra\/|supabase\/)/;
const DB =
  /^(packages\/(db|aplicacion)\/|tools\/(db|humo|respaldo)\/|apps\/web\/src\/app\/api\/|vitest\.config\.ts$)/;
const WEB = /^(apps\/web\/|packages\/(?!.*\.test\.ts$))/;
// Los documentos y los scripts de las fases anteriores (07 §13.7, TA-252): docs:comprobar solo si cambian
const DOCS = /^(docs\/|tools\/docs\/)/;
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

/** M4: en ahorro, e2e de PR solo al pasar a listo (07 §6.5, §32.3). Sin estado del mes, normal. */
function e2eSegunModo() {
  const estado = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, 'utf8')) : null;
  return (
    evento !== 'pull_request' || e2eDePr(recortesVigentes(estado, new Date()), env('FINN_ACCION'))
  );
}

/** M1: integracion con afecta_db o PR listo. M2: e2e en PR listo con afecta_web. En main, todo (07 §6.1).
 * afecta_docs: el diff toca docs/ o tools/docs/ y `rapido` corre docs:comprobar (07 §13.7). */
function decidir(archivos, b) {
  const db = archivos.some((a) => CI.test(a) || DB.test(a));
  const web = archivos.some((a) => CI.test(a) || WEB.test(a));
  const enMain = evento === 'push';
  const listo = evento === 'pull_request' && env('FINN_BORRADOR') !== 'true';
  return {
    afecta_db: db,
    afecta_web: web,
    integracion: enMain || listo || db,
    e2e: enMain || ((listo || evento === '') && web && e2eSegunModo()),
    cierre: enMain || aTerminada(b),
    afecta_docs: archivos.some((a) => DOCS.test(a)),
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
    // Siempre y antes del inventario: `vitest list` recolecta `componentes` en Chromium
    ...(enCi ? [['navegadores', NAVEGADORES]] : []),
    ['inventario', 'pnpm pruebas:listar'],
    ['matriz', 'pnpm pruebas:matriz'],
    ...(d.afecta_docs ? [['docs', 'pnpm docs:comprobar']] : []),
    ['minutos', 'node tools/ci/minutos.ts rapido'],
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
  const ok = correr([
    ...navegadores,
    ['e2e', `node tools/pruebas/e2e.mjs --project=movil${filtro}`],
  ]);
  return inestables() && ok;
}

/** 07 §7.3: en CI, al terminar Playwright, los `flaky` abren o actualizan su issue `prueba-inestable`. */
function inestables() {
  const informe = 'apps/web/test-results/informe.json';
  if (!enCi || !existsSync(informe)) return true;
  return correr([['inestables', `node tools/pruebas/inestables.mjs ${informe}`]]);
}

/** Las suites del nocturno que ya existen (07 §6.1): PROP con FC_RUNS=10000 (lo fija nocturno.yml); con tantos casos el timeout de 5 s no alcanza, así que sube solo acá. */
function nocturno() {
  if (process.env.FINN_NOCTURNO === 'ren') return ren();
  // Job `respaldo` (TA-251; 07 §19.6, nivel RES): volcado, cifrado con age y restauración sin `auth`
  if (process.env.FINN_NOCTURNO === 'respaldo') return correr([['RES', 'pnpm test:respaldo']]);
  const prop = correr([
    [
      'PROP',
      'node tools/pruebas/vitest.mjs --project unidad --testTimeout=120000 packages/dominio tools/pruebas/oraculo',
    ],
  ]);
  return mutantes() && prop;
}

/** Job `ren` (TA-156; 07 §6.6): carga y verificaciones diferidas, `calcular` y el registro de las medianas; los tiempos no fallan, el registro avisa. */
function ren() {
  process.env.FINN_REN = '1';
  const carga = correr([
    ['REN carga', 'pnpm test:integracion packages/db/test/carga-volumen.int.test.ts'],
  ]);
  const calcular = correr([
    ['REN calcular', 'pnpm bench --outputJson test-results/ren/bench.json'],
  ]);
  // LCP, CLS e INP (05 §13.4; TA-222): en este job para que FINN_REN_ROJO sea uno solo
  const web = correr([
    ['navegadores', NAVEGADORES],
    ['REN web', 'node tools/pruebas/e2e.mjs --project=movil -g PRU-REN-(PWA-00[34]|TX-001)'],
  ]);
  const registro = correr([['REN registro', 'node tools/pruebas/volumen/registrar.ts']]);
  return carga && calcular && web && registro;
}

// Mutantes del motor (07 §19.4, DP-26; TA-112): vitest.config.ts compila FINN_MUTANTE en @finn/dominio.
const MUTANTES = ['arrastre', 'traslado', 'orden', 'cierre'];
const VITEST = join(
  dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
  'vitest.mjs',
);

/** PROP y ESC@motor con cada mutante: si ninguna prueba falla, el mutante sobrevivió y el nocturno falla. */
function mutantes() {
  const vivos = [];
  for (const m of MUTANTES) {
    const informe = `test-results/mutantes/${m}.json`;
    rmSync(informe, { force: true }); // un informe de otra corrida no cuenta
    console.log(
      enCi
        ? `::group::mutante ${m}`
        : `
▶ mutante ${m}`,
    );
    spawnSync(
      process.execPath,
      [
        VITEST,
        'run',
        '--project',
        'unidad',
        '--project',
        'escenarios-motor',
        '--coverage.enabled=false',
        '--passWithNoTests',
        '--bail=1',
        '--testTimeout=120000',
        '--reporter=default',
        '--reporter=json',
        `--outputFile.json=${informe}`,
        '.prop.test.ts',
        '.motor.test.ts',
      ],
      { stdio: 'inherit', env: { ...process.env, FINN_MUTANTE: m } },
    );
    if (enCi) console.log('::endgroup::');
    const fallidas = existsSync(informe)
      ? (JSON.parse(readFileSync(informe, 'utf8')).numFailedTests ?? 0)
      : 0;
    if (fallidas > 0) console.log(`✓ mutante ${m}: muerto (${fallidas} pruebas fallidas)`);
    else {
      console.error(`✗ mutante ${m}: sobrevivió (ninguna PROP ni ESC@motor falló)`);
      vivos.push(m);
    }
  }
  return vivos.length === 0;
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
} else if (modo === 'nocturno') ok = nocturno();
else if (modo !== 'decidir') {
  console.error(`afecta: modo desconocido ${modo} (decidir, rapido, e2e, local, nocturno)`);
  ok = false;
}
process.exit(ok ? 0 : 1);
