// tools/ci/afecta.mjs — qué toca el diff y qué corre (TA-012; 07 §6.1, §6.5 M1 a M3, §32.2 M5; 08 DT-07; DP-34).
//   node tools/ci/afecta.mjs [--archivos a,b]  JSON con afecta_db, afecta_web e integracion
//   node tools/ci/afecta.mjs rapido            `pnpm ci:rapido`: controles fijos y suites de `rapido` (CH-266: sin
//                                              navegadores, inventario, matriz ni `componentes`; van al nocturno)
//   node tools/ci/afecta.mjs e2e               `pnpm ci:e2e`: con FINN_E2E_GREP (el nocturno: `todas`) o las afectadas
//                                              (en CI, el fragmento FINN_E2E_FRAGMENTO=i/n; CH-231)
//   node tools/ci/afecta.mjs e2e-unir          `pnpm ci:e2e-unir`: une los fragmentos; FINN_E2E_FRAGMENTOS = su resultado
//   node tools/ci/afecta.mjs local             `pnpm ci:local` (DT-07): rapido y, con afecta_db, integracion (CH-266)
//   node tools/ci/afecta.mjs nocturno          `pnpm ci:nocturno` (TA-013): las suites del nocturno que ya existen
//   node tools/ci/afecta.mjs cierre-previo     en `pnpm ci:cierre` (CH-239): en main con E2E parcial, suma el informe de
//                                              la última E2E completa de main; cierre-guardar la reemplaza tras M15
// Entorno: FINN_EVENTO (pull_request | push; vacío en local y en el nocturno), FINN_BASE (por defecto origin/main; en
// main, el commit anterior al push). Con GITHUB_OUTPUT, las decisiones quedan como salidas del paso.
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { afectadas, clase, claseDe, seleccionE2E } from '../pruebas/afectadas.ts';
import { BASE_E2E, COMPLETA, baseE2e, registroE2e, shaDe } from './reutiliza-e2e.ts';
import { cargarEntradas, verificar } from '../pruebas/matriz.ts';
import { cambiosDeEstado } from '../pruebas/resumen.ts';

// La base (integracion) y la web (e2e). Un cambio de CI cuenta como los dos: así el workflow se prueba entero.
// tools/humo/: humo.test.ts (PRU-SEG-OPER-103 y 106) vive en el proyecto `integracion` de vitest.config.ts.
// tools/respaldo/: un cambio solo en restaurar.sh también tiene que correr sus controles (CH-58).
const CI = /^(\.github\/|tools\/ci\/|pnpm-lock\.yaml$|infra\/|supabase\/)/;
const DB =
  /^(packages\/(db|aplicacion)\/|tools\/(db|humo|respaldo)\/|apps\/web\/src\/(?:app\/api|servidor)\/|vitest\.config\.ts$)/;
const WEB = /^(apps\/web\/|packages\/(?!.*\.test\.ts$))/;
// Los documentos y los scripts de las fases anteriores (07 §13.7, TA-252): docs:comprobar solo si cambian
const DOCS = /^(docs\/|tools\/docs\/)/;
// CH-231: lo que es solo interfaz para el modo corto de `ci:local`. Sin la configuración de Playwright, los ayudantes
// de e2e/, package.json ni lo que DB toma (api/ y servidor/): con cualquiera de esos, el modo es el completo.
const INTERFAZ = /^apps\/web\/(src\/|public\/|tailwind\.css$|e2e\/.*\.e2e\.ts$)/;
const NAVEGADORES = 'pnpm exec playwright install --with-deps chromium';
// CH-239: el mapa del repositorio, no el del cwd: sin él, ningún archivo deja la clase 3
const MAPA = JSON.parse(
  readFileSync(new URL('../../pruebas/mapa-codigo.json', import.meta.url), 'utf8'),
);

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

/** Las fichas que pasan a `terminada` en pruebas/features.json respecto de la base (07 §22.2). */
function aTerminada(b) {
  const antes = git('show', `${b}:pruebas/features.json`);
  const f = 'pruebas/features.json';
  const ahora = JSON.parse(existsSync(f) ? readFileSync(f, 'utf8') : '{}');
  const cambios = cambiosDeEstado(JSON.parse(antes.ok ? antes.salida : '{}'), ahora);
  return cambios.filter((c) => c.endsWith('→ terminada')).map((c) => c.split(':')[0]);
}

/** M1 (CH-266): integracion solo con afecta_db, en PR, en main y en local. La E2E, `componentes`, el inventario, la
 * matriz con resultados (M15) y `cierre` corren en nocturno.yml y no bloquean merges ni despliegues.
 * afecta_docs: el diff toca docs/ o tools/docs/ y `rapido` corre docs:comprobar (07 §13.7).
 * solo_interfaz (CH-231), e2e_completa (CH-231) y clase_e2e (CH-239): quedan para `pnpm ci:e2e` a demanda (`grepE2E`);
 * clase_e2e es la clase del diff (0 a 3, `clase` de afectadas.ts) y, en main sin `base_e2e`, 3. */
function decidir(archivos, b, be) {
  const db = archivos.some((a) => CI.test(a) || DB.test(a));
  const web = archivos.some((a) => CI.test(a) || WEB.test(a));
  const enMain = evento === 'push';
  const cierra = aTerminada(b).length > 0;
  const propios = archivos.filter((a) => clase(a, MAPA) > 0);
  return {
    afecta_db: db,
    afecta_web: web,
    integracion: db,
    afecta_docs: archivos.some((a) => DOCS.test(a)),
    solo_interfaz: propios.length > 0 && !db && !cierra && propios.every((a) => INTERFAZ.test(a)),
    e2e_completa: evento !== '' && archivos.some((a) => CI.test(a)),
    clase_e2e: enMain && be === '' ? 3 : claseDe(archivos, MAPA),
    base_e2e: be,
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

/** Filtro `-g` de la E2E (07 §6.1): `todas` (CI, marco o una ficha que se cierra, CH-70; en main, la clase 3), `^$` o los
 * identificadores. CH-239: en las clases 1 y 2, las afectadas sin el marco más las fijas de su clase (`seleccionE2E`). */
function grepE2E(archivos, sinMarco = false) {
  if (d.e2e_completa || (evento === 'push' && d.clase_e2e === 3)) return 'todas';
  const e = cargarEntradas();
  const propios = archivos.filter((a) => clase(a, e.mapa) > 0);
  const a = afectadas(e, verificar(e), propios, aTerminada(b), sinMarco || d.clase_e2e < 3);
  return seleccionE2E(d.clase_e2e, a.grepE2E);
}

/** CH-266: sin navegadores, inventario, matriz ni `componentes` (van al job `suites` del nocturno). */
function rapido(b, d) {
  return correr([
    ['plan:verificar', 'pnpm plan:verificar'],
    ['typecheck', 'pnpm typecheck'],
    ['lint', 'pnpm lint'],
    ['formato', 'pnpm formato:comprobar'],
    ['versiones', 'node tools/pruebas/versiones.mjs'],
    ...secretos(b),
    ['C1', 'node tools/db/verificar-migraciones.mjs packages/db/prisma/migrations'],
    ['C2', 'bash tools/db/inmutabilidad.sh'],
    ['firmas', 'bash tools/pruebas/firmas.sh origin/main'],
    ...(d.afecta_docs ? [['docs', 'pnpm docs:comprobar']] : []),
    ['minutos', 'node tools/ci/minutos.ts rapido'],
    [
      'pruebas',
      `node tools/pruebas/vitest.mjs --project unidad --project escenarios-motor --project contratos ${jsonEn('rapido')}`,
    ],
  ]);
}

/** El informe JSON de Vitest en test-results/informes/<n>.json, el que lee M15 en `cierre`. */
const jsonEn = (n) =>
  `--reporter=default --reporter=json --outputFile.json=test-results/informes/${n}.json`;

/** CH-231: en CI, `e2e-fragmento` corre un fragmento `i/n` de Playwright (`--shard`) con su propia pila; el informe
 * blob lo une el job `e2e` (`e2eUnir`), que también avisa las inestables. */
function e2e(archivos, sinMarco = false) {
  // CH-239: también en main, el filtro que eligió `rapido`; sin él, en main la suite completa
  const grep = env('FINN_E2E_GREP') || (evento === 'push' ? 'todas' : grepE2E(archivos, sinMarco));
  if (grep === '^$') return console.log('e2e: ninguna suite afectada por el diff') === undefined;
  const fragmento = env('FINN_E2E_FRAGMENTO');
  if (fragmento !== '' && !/^\d+\/\d+$/.test(fragmento)) {
    console.error(`e2e: FINN_E2E_FRAGMENTO=${fragmento} no es i/n`);
    return false;
  }
  // e2e.mjs pasa por la consola en Windows: ahí el `|` del filtro va entre comillas
  const filtro = grep === 'todas' ? '' : ` -g ${windows ? `"${grep}"` : grep}`;
  const shard = fragmento === '' ? '' : ` --shard=${fragmento}`;
  const navegadores = enCi ? [['navegadores', NAVEGADORES]] : [];
  const ok = correr([
    ...navegadores,
    ['e2e', `node tools/pruebas/e2e.mjs --project=movil${filtro}${shard}`],
  ]);
  return (fragmento !== '' || inestables()) && ok;
}

/** Job `e2e` (CH-231): une los blobs de los fragmentos en el informe JSON de siempre (`apps/web/test-results/
 * informe.json`, el que leen `cierre` e `inestables`) y pasa solo si todos los fragmentos pasaron. Deja al lado
 * COMPLETA con el filtro y las pruebas: `main` reutiliza esa E2E solo si fue la suite completa (TA-555). */
function e2eUnir() {
  const blobs = 'test-results/e2e-blob';
  const fragmentos = env('FINN_E2E_FRAGMENTOS');
  let ok = true;
  if (existsSync(blobs) && readdirSync(blobs).some((f) => f.endsWith('.zip'))) {
    mkdirSync('apps/web/test-results', { recursive: true });
    process.env.PLAYWRIGHT_JSON_OUTPUT_FILE = resolve('apps/web/test-results/informe.json');
    const unir = `pnpm --dir apps/web exec playwright merge-reports --reporter json ${resolve(blobs)}`;
    ok = correr([['unir', unir]]) && inestables();
    const informe = 'apps/web/test-results/informe.json';
    if (existsSync(informe)) {
      const filtro = env('FINN_E2E_GREP') || (evento === 'push' ? 'todas' : '');
      const r = registroE2e(JSON.parse(readFileSync(informe, 'utf8')), filtro, fragmentos);
      writeFileSync(`apps/web/test-results/${COMPLETA}`, `${JSON.stringify(r)}\n`);
    }
  } else console.log('e2e: ningún fragmento dejó informe (sin suites afectadas)');
  if (fragmentos !== 'success') {
    console.error(`✗ e2e: los fragmentos terminaron en «${fragmentos || 'sin resultado'}»`);
    return false;
  }
  return ok;
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
  // Job `suites` (CH-266): lo que salió de `rapido` y de los PR, con los informes que lee M15 en `cierre`
  if (process.env.FINN_NOCTURNO === 'suites') {
    const vitest = correr([
      ['navegadores', NAVEGADORES],
      [
        'pruebas',
        `node tools/pruebas/vitest.mjs --project unidad --project escenarios-motor --project contratos --project componentes ${jsonEn('rapido')}`,
      ],
    ]);
    return correr([['integracion', `pnpm test:integracion ${jsonEn('integracion')}`]]) && vitest;
  }
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

/** CH-239: en main, la E2E completa: la propia (filtro `todas`) o la del PR reutilizada (CH-231 c). */
const completaEnMain = () =>
  evento === 'push' && (env('FINN_REUTILIZA_E2E') !== '' || env('FINN_E2E_GREP') === 'todas');

/** CH-239: `cierre` de main con E2E parcial suma para M15 el informe de la última E2E completa de main, la que eligió
 * `rapido` (FINN_BASE_E2E): una prueba que no corrió ahora conserva ese resultado y, si corrió, cuenta la peor. Sin ese
 * informe, rojo. En un PR o con la completa, nada. */
function cierrePrevio() {
  if (evento !== 'push' || completaEnMain()) return true;
  const informe = join(dirname(BASE_E2E), 'informe.json');
  let sha;
  try {
    sha = shaDe(JSON.parse(readFileSync(BASE_E2E, 'utf8')));
  } catch {
    sha = '';
  }
  if (sha === '' || sha !== env('FINN_BASE_E2E') || !existsSync(informe)) {
    console.error(
      `✗ cierre: E2E parcial en main sin el informe de su base completa (pedida ${env('FINN_BASE_E2E') || 'ninguna'}, en la caché ${sha || 'ninguna'})`,
    );
    return false;
  }
  mkdirSync('test-results/informes', { recursive: true });
  copyFileSync(informe, 'test-results/informes/e2e-base.json');
  console.log(`cierre: M15 suma el informe de la E2E completa de ${sha}`);
  return true;
}

/** CH-239: tras M15 en verde con la E2E completa en main, su informe y el commit quedan como la nueva base (ci.yml la
 * guarda en la caché con `base_e2e_nueva`). Si no puede, avisa: la próxima corrida de main será la completa. */
function cierreGuardar() {
  const sha = env('GITHUB_SHA');
  const informe = 'test-results/informes/informe.json';
  if (!completaEnMain()) return true;
  if (!/^[0-9a-f]{40}$/.test(sha) || !existsSync(informe)) {
    console.warn(`aviso cierre: sin ${informe} o GITHUB_SHA, no queda base de E2E completa`);
    return true;
  }
  mkdirSync(dirname(BASE_E2E), { recursive: true });
  copyFileSync(informe, join(dirname(BASE_E2E), 'informe.json'));
  writeFileSync(BASE_E2E, `${JSON.stringify({ sha })}\n`);
  salidas({ base_e2e_nueva: sha });
  return true;
}

const argv = process.argv.slice(2);
const modo = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'decidir';
// `cierre` corre con un checkout de un solo commit: sus modos no miran el diff
if (modo === 'cierre-previo') process.exit(cierrePrevio() ? 0 : 1);
if (modo === 'cierre-guardar') process.exit(cierreGuardar() ? 0 : 1);
let be = '';
try {
  if (evento === 'push' && existsSync(BASE_E2E))
    be = baseE2e(JSON.parse(readFileSync(BASE_E2E, 'utf8')), git);
} catch {
  be = '';
}
const b = be || base();
const k = argv.indexOf('--archivos');
const archivos = k >= 0 ? (argv[k + 1] ?? '').split(',').filter(Boolean) : cambiados(b);
const d = decidir(archivos, b, be);
console.log(modo === 'decidir' ? JSON.stringify(d) : `afecta (base ${b}): ${JSON.stringify(d)}`);
salidas(d);

let ok = true;
if (modo === 'rapido') ok = rapido(b, d);
else if (modo === 'e2e') ok = e2e(archivos);
else if (modo === 'e2e-unir') ok = e2eUnir();
else if (modo === 'local') {
  // CH-266: lo mismo que la CI del PR, sin E2E; a demanda quedan `pnpm test:e2e`, `test:componentes`, `pruebas:listar`
  // y `pruebas:matriz`.
  ok = rapido(b, d);
  if (ok && d.integracion) ok = correr([['integracion', 'pnpm ci:integracion']]);
  console.log(`ci:local: ${ok ? 'verde' : 'rojo'}${d.integracion ? ' (con integracion)' : ''}`);
} else if (modo === 'nocturno') ok = nocturno();
else if (modo !== 'decidir') {
  console.error(
    `afecta: modo desconocido ${modo} (decidir, rapido, e2e, e2e-unir, local, nocturno)`,
  );
  ok = false;
}
process.exit(ok ? 0 : 1);
