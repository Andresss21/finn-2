// tools/plan/estado.ts — estado de las tareas en plan/tareas.json (DT-04, 08 §1.4).
//   node tools/plan/estado.ts verificar [--negativo]  → `pnpm plan:verificar`: verificar.ts (§9) y el estado
//   node tools/plan/estado.ts siguiente                → `pnpm plan:siguiente`: lo que se puede empezar ahora
// Sale con 1 si encuentra errores (o, con --negativo, si alguna mutación no se detecta).
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { leerFichas } from './encargo.ts';

type Entrada = { estado: string; pr?: number; rama?: string; motivo?: string };
type Estado = Record<string, Entrada>;
type Ficha = ReturnType<typeof leerFichas>[number];
type Hallazgo = { codigo: string; detalle: string };
type Contexto = { fichas: Ficha[]; base: Estado; rama: string; d06: string };

const ESTADO = 'plan/tareas.json';
const ESTADOS = ['pendiente', 'en_curso', 'terminada', 'bloqueada', 'retirada'];
const VERIFICAR = 'tools/plan/verificar.ts --plan docs/08-tareas.md --objetivos plan/objetivos.txt';

const lista = (v = ''): string[] =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^T[AU]-\d+$/.test(s));
const deps = (f: Ficha): string[] => lista(f.datos['depende']);
const con = (f: Ficha): string[] =>
  f.datos['paralelo']?.startsWith('con ') ? lista(f.datos['paralelo'].slice(4)) : [];

function git(...a: string[]): string | null {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// DT-04: una entrada por línea y una línea en blanco entre entradas, para que git las una sin conflicto.
export function formato(texto: string): Hallazgo[] {
  const l = texto.split('\n');
  return l.flatMap((x, i) =>
    /^\s*"TA-\d{3}"/.test(x) && i > 1 && l[i - 1]?.trim() !== ''
      ? [{ codigo: 'S9-formato', detalle: `línea ${i + 1}: entrada sin línea en blanco antes` }]
      : [],
  );
}

// Un motivo "CF-nn" sigue vigente mientras 06 §0.7 marca ese CF como diferido (DT-31: TA-549 y CF-03).
const vigente = (motivo: string, d06: string): boolean =>
  [...motivo.matchAll(/CF-\d{2}/g)].some((m) =>
    new RegExp(`^\\| ${m[0]} \\|.*Diferido`, 'm').test(d06),
  );

export function verificarEstado(e: Estado, c: Contexto): Hallazgo[] {
  const h: Hallazgo[] = [];
  const err = (codigo: string, detalle: string): number => h.push({ codigo, detalle });
  for (const f of c.fichas) if (!e[f.id]) err('S1-sin-entrada', `${f.id} no está en ${ESTADO}`);
  for (const [id, x] of Object.entries(e)) {
    const f = c.fichas.find((y) => y.id === id);
    if (!f) {
      err('S1-sin-tarea', `${id} no es una tarea del plan`);
      continue;
    }
    if (!ESTADOS.includes(x.estado)) err('S2-estado', `${id}: estado "${x.estado}" inválido`);
    if (x.estado === 'terminada' && !(Number.isInteger(x.pr) && (x.pr ?? 0) > 0))
      err('S3-pr', `${id}: terminada exige el número de PR`);
    if (x.pr !== undefined && ['pendiente', 'retirada'].includes(x.estado))
      err('S3-pr', `${id}: tiene PR y está ${x.estado}`);
    if (x.estado === 'bloqueada' && !x.motivo?.trim())
      err('S4-motivo', `${id}: bloqueada sin motivo`);
    if (x.estado === 'en_curso' || x.estado === 'terminada')
      for (const d of deps(f))
        if (c.base[d]?.estado !== 'terminada')
          err('S5-dependencia', `${id} está ${x.estado} y ${d} no está terminada en la base`);
    const antes = c.base[id];
    if (
      antes?.estado === 'bloqueada' &&
      x.estado !== 'bloqueada' &&
      vigente(antes.motivo ?? '', c.d06)
    )
      err('S6-desbloqueo', `${id} deja de estar bloqueada con su motivo vigente (${antes.motivo})`);
    if (x.estado === 'en_curso' && !x.rama?.startsWith(id.toLowerCase() + '-'))
      err('S7-rama', `${id}: en_curso exige la rama ${id.toLowerCase()}-<tema>`);
  }
  const deRama = e[(/^ta-\d{3}(?=-)/.exec(c.rama)?.[0] ?? '').toUpperCase()];
  if (deRama && !['en_curso', 'terminada'].includes(deRama.estado))
    err('S7-rama', `la rama ${c.rama} es de una tarea que figura ${deRama.estado}`);
  return h;
}

// Control negativo: [qué se rompe, código que debe aparecer, mutación].
function mutaciones(c: Contexto, e: Estado): [string, string, (x: Estado) => unknown][] {
  const dep = c.fichas.find(
    (f) => e[f.id]?.estado === 'pendiente' && deps(f).some((d) => e[d]?.estado !== 'terminada'),
  );
  const fin = Object.keys(e).find((k) => e[k]?.estado === 'terminada') ?? 'TA-001';
  return [
    ['tarea del plan sin entrada', 'S1-sin-entrada', (x) => delete x['TA-003']],
    ['entrada que no es del plan', 'S1-sin-tarea', (x) => (x['TA-999'] = { estado: 'pendiente' })],
    ['estado inválido', 'S2-estado', (x) => (x['TA-003'] = { estado: 'hecha' })],
    ['terminada sin PR', 'S3-pr', (x) => (x[fin] = { estado: 'terminada' })],
    ['bloqueada sin motivo', 'S4-motivo', (x) => (x['TA-003'] = { estado: 'bloqueada' })],
    [
      'en curso con una dependencia sin terminar',
      'S5-dependencia',
      (x) => dep && (x[dep.id] = { estado: 'en_curso', rama: dep.id.toLowerCase() + '-x' }),
    ],
    [
      'TA-549 desbloqueada con CF-03 diferido',
      'S6-desbloqueo',
      (x) => (x['TA-549'] = { estado: 'pendiente' }),
    ],
    ['en curso sin rama', 'S7-rama', (x) => (x['TA-003'] = { estado: 'en_curso' })],
  ];
}

function leer(): { c: Contexto; texto: string; e: Estado; remoto: boolean } {
  const fichas = leerFichas(readFileSync('docs/08-tareas.md', 'utf8'));
  const texto = readFileSync(ESTADO, 'utf8');
  const e = JSON.parse(texto) as Estado;
  const r = git('show', `origin/main:${ESTADO}`);
  const rama = (git('rev-parse', '--abbrev-ref', 'HEAD') ?? '').trim();
  const d06 = readFileSync('docs/06-features.md', 'utf8');
  return {
    c: { fichas, base: r ? (JSON.parse(r) as Estado) : e, rama, d06 },
    texto,
    e,
    remoto: r !== null,
  };
}

function verificar(negativo: boolean): boolean {
  const args = [...VERIFICAR.split(' '), '--docs', 'docs', ...(negativo ? ['--negativo'] : [])];
  const plan = spawnSync(process.execPath, args, { stdio: 'inherit' });
  const { c, texto, e, remoto } = leer();
  if (!remoto)
    console.log(`Aviso: origin/main no tiene ${ESTADO}; la base es el archivo local (arranque).`);
  const h = [...formato(texto), ...verificarEstado(e, c)];
  console.log(
    `Estado (DT-04): ${Object.keys(e).length} entradas, ${h.length} errores; rama ${c.rama}.`,
  );
  for (const x of h) console.log(`ERROR ${x.codigo}: ${x.detalle}`);
  let fallo = plan.status !== 0 || h.length > 0;
  if (negativo && h.length === 0) {
    const r = mutaciones(c, e).map(([nombre, espera, aplicar]) => {
      const x = structuredClone(e);
      aplicar(x);
      return [nombre, espera, verificarEstado(x, c).some((y) => y.codigo === espera)] as const;
    });
    const pegado = formato(texto.replace(/\n\n(\s*"TA-003")/, '\n$1')).length > 0;
    r.push(['dos entradas sin línea en blanco', 'S9-formato', pegado]);
    for (const [n, esp, ok] of r)
      console.log(`${ok ? 'detectada' : 'NO DETECTADA'}: ${n} → ${esp}`);
    const ok = r.filter((x) => x[2]).length;
    console.log(`Control negativo del estado: ${ok} de ${r.length} mutaciones detectadas.`);
    if (ok !== r.length) fallo = true;
  }
  console.log(fallo ? 'RESULTADO: FALLA' : 'RESULTADO: PASA');
  return !fallo;
}

// Disponibles: pendientes con sus dependencias terminadas. Las TU solo bloquean el merge (08 §1.3).
function siguiente(): void {
  const { c, e, remoto } = leer();
  const por = (estado: string): Ficha[] => c.fichas.filter((f) => e[f.id]?.estado === estado);
  const juntas = (a: Ficha, b: Ficha): boolean =>
    ![a, b].some((f) => f.datos['paralelo'] === 'no') &&
    !con(a).includes(b.id) &&
    !con(b).includes(a.id);
  const enCurso = por('en_curso');
  const libres = por('pendiente')
    .filter((f) => deps(f).every((d) => e[d]?.estado === 'terminada'))
    .sort((a, b) => Number(a.datos['orden']) - Number(b.datos['orden']));
  console.log(`Estado: ${ESTADO} ${remoto ? 'de origin/main' : 'local'}.`);
  console.log(`En curso: ${enCurso.map((f) => f.id).join(', ') || '—'}.`);
  for (const f of por('bloqueada')) console.log(`Bloqueada: ${f.id} (${e[f.id]?.motivo})`);
  console.log(`Disponibles (${libres.length}):`);
  for (const f of libres) {
    const espera = enCurso.filter((g) => !juntas(f, g)).map((g) => g.id);
    const otras = libres.filter((g) => g !== f && juntas(f, g)).map((g) => g.id);
    console.log(`  ${f.id} ${f.titulo}`);
    console.log(
      `    orden ${f.datos['orden']} · revisión ${f.datos['revision']} · paralelo: ${f.datos['paralelo']}` +
        ` · TU para mergear: ${f.datos['tu']} · ${espera.length ? `espera a ${espera.join(', ')}` : 'puede empezar ahora'}` +
        ` · junto con: ${otras.join(', ') || 'ninguna'}`,
    );
  }
}

const orden = process.argv[2];
if (orden === 'verificar') process.exit(verificar(process.argv.includes('--negativo')) ? 0 : 1);
else if (orden === 'siguiente') siguiente();
else {
  console.log('Uso: node tools/plan/estado.ts verificar [--negativo] | siguiente');
  process.exit(1);
}
