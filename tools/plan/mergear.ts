// tools/plan/mergear.ts — `pnpm pr:mergear <n> [--aprobado] [--dry-run] [--resumen] [--sin-ci]` (TA-010; 07 §6.3, §22.2,
// §31.5, RS7-09; 08 DT-01, DT-05, DT-06, DT-07). Pasos: 1 checks, 2 archivos del usuario, 3 tamaño, 4 revisión
// obligatoria, 5 resumen, 6 `gh pr merge --squash`. `--dry-run` y `--resumen` (Markdown) hacen 1 a 5 y nunca mergean.
// `--sin-ci` acepta un PR sin ningún check, solo hasta que TA-012 traiga ci.yml, y lo deja escrito en la salida.
// Sale con 0 (listo o mergeado), 1 (no se mergea) o 3 (con --dry-run o --resumen: todo en orden salvo --aprobado).
import { spawnSync } from 'node:child_process';
import type { Entradas } from '../pruebas/matriz.ts';
import { lineasResumen, resumenPendientes } from '../pruebas/pendientes.ts';
import { resumen } from '../pruebas/resumen.ts';
import { leerFichas } from './encargo.ts';
import * as t from './tamano.ts';

export type Respuesta = { status: number; stdout: string; stderr: string };
export type Run = (cmd: string, args: string[]) => Respuesta;
// entrada: carpeta de la entrada de los documentos (CH-10), si existe en esta PC
export type Opciones = {
  numero: number;
  aprobado: boolean;
  dryRun: boolean;
  resumen: boolean;
  sinCi: boolean;
  entrada?: string;
};

const DEL_USUARIO = [
  'pruebas/manuales/resultados.md',
  'pruebas/firmantes-permitidos',
  'plan/tu.md',
];
// Áreas de DT-05 (08 §1.5). `docs/` no es un área: sus copias de anexos no son el código que protegen.
const AREAS: [string, RegExp][] = [
  ['migraciones y esquema', /^(packages\/db\/prisma\/|tools\/db\/)/],
  ['motor', /^packages\/dominio\/src\/(calculo|operaciones|valores)\//],
  [
    'seguridad',
    /(^|\/)(proxy\.ts$|api\/)|^tools\/pruebas\/firmas\.sh$|autoriz|aal2|firma|token(?!s?\.(css|json)$)/i,
  ],
  ['reloj', /reloj|(^|\/)instrumentation\.ts$/i],
  ['CI y workflows', /^(\.github\/|tools\/ci\/)/],
  ['instrucciones de los agentes', /^(CLAUDE\.md|\.claude\/settings\.json)$/],
];
const CHECKS = (aTerminada: boolean): [string, boolean][] => [
  ['rapido', true],
  ['cierre', aTerminada],
  ['integracion', false],
  ['e2e', false],
];

export function mergear(op: Opciones, run: Run): { codigo: number; salida: string[] } {
  const [salida, fallas] = [[] as string[], [] as string[]];
  const out = (paso: number, s: string): number => salida.push(`paso ${paso}: ${s}`);
  const sh = (linea: string, ...extra: string[]): string | null => {
    const r = run(linea.split(' ')[0] ?? '', [...linea.split(' ').slice(1), ...extra]);
    return r.status === 0 ? r.stdout : null;
  };
  const n = String(op.numero);
  const vista = sh(
    `gh pr view ${n} --json title,body,state,isDraft,headRefName,headRefOid,baseRefName`,
  );
  if (vista === null) return { codigo: 1, salida: [`no se pudo leer el PR #${n} con gh pr view`] };
  const pr = JSON.parse(vista) as Record<string, string>;
  const [base, cab, titulo] = [
    `origin/${pr['baseRefName']}`,
    pr['headRefOid'] ?? '',
    pr['title'] ?? '',
  ];
  const tarea =
    /TA-\d{3}/.exec(titulo)?.[0] ?? /^Tarea: (TA-\d{3})/m.exec(pr['body'] ?? '')?.[1] ?? '';
  sh(`git fetch origin ${pr['baseRefName']} pull/${n}/head`);
  const show = (ref: string, p: string, d = ''): string => sh('git show', `${ref}:${p}`) ?? d;
  const json = <T>(ref: string, p: string, d: string): T => JSON.parse(show(ref, p, d)) as T;
  const ficha =
    leerFichas(show(base, 'docs/08-tareas.md')).find((f) => f.id === tarea)?.datos ?? {};
  salida.push(`pr:mergear #${n} — ${titulo}`);
  if (pr['state'] !== 'OPEN') fallas.push(`el PR está ${pr['state']}`);
  if (pr['isDraft']) fallas.push('el PR está en borrador');
  if (!ficha['revision'])
    fallas.push(`la tarea "${tarea}" del título no está en docs/08-tareas.md`);

  // Resumen de fichas antes del paso 1: `cierre` se exige si el PR pasa una ficha a terminada (07 §22.2)
  const docs = (ref: string, p: string): string => show(ref, `docs/${p}.md`);
  const e: Entradas = {
    ...{
      d01: docs(cab, '01-dominio'),
      d04: docs(cab, '04-backend'),
      d05: docs(cab, '05-frontend'),
      d06: docs(cab, '06-features'),
    },
    ...{
      inventario: [],
      mapa: [],
      previas: null,
      cuarentena: [],
      hoy: '',
      puerta: false,
      codigo: [],
    },
    features: json(cab, 'pruebas/features.json', '{}'),
    pendientes: json(cab, 'pruebas/pendientes-e2e.json', '[]'),
    manuales: show(cab, 'pruebas/manuales.md'),
    resultadosManuales: show(cab, 'pruebas/manuales/resultados.md'),
  };
  const base5 = {
    features: json<Entradas['features']>(base, 'pruebas/features.json', '{}'),
    pendientes: json<Entradas['pendientes']>(base, 'pruebas/pendientes-e2e.json', '[]'),
  };
  const fichas = resumen(base5.features, e);

  // Paso 1: checks (07 §6.3): verde en rapido (y cierre si corresponde), y en integracion y e2e si corrieron
  const rc = run('gh', ['pr', 'checks', n, '--json', 'name,bucket']);
  const vacio = /no checks reported/.test(rc.stderr) ? [] : null;
  const checks = rc.stdout.trim().startsWith('[')
    ? (JSON.parse(rc.stdout) as { name: string; bucket: string }[])
    : vacio;
  if (checks === null) fallas.push(`paso 1: gh pr checks no respondió: ${rc.stderr.trim()}`);
  else if (!checks.length && op.sinCi)
    out(1, 'AVISO --sin-ci: el PR no tiene checks; CI sin verificar');
  else if (!checks.length)
    fallas.push('paso 1: el PR no tiene checks (--sin-ci solo hasta TA-012)');
  for (const [nombre, exigido] of checks?.length ? CHECKS(fichas.aTerminada) : []) {
    const b = checks?.find((c) => c.name === nombre)?.bucket ?? 'skipping';
    if (b === 'pass') out(1, `${nombre}: pass`);
    else if (b !== 'skipping') fallas.push(`paso 1: ${nombre}: ${b}`);
    else if (exigido) fallas.push(`paso 1: ${nombre}: no corrió`);
  }

  // Paso 2: archivos que solo cambia el usuario, con commits firmados (07 §22.2)
  const rango = `${base}...${cab}`;
  const estados = (sh(`git diff --name-status ${rango}`) ?? '')
    .split('\n')
    .map((l) => l.split('\t'));
  for (const p of DEL_USUARIO)
    if (estados.some((c) => c.slice(1).includes(p))) fallas.push(`paso 2: el diff toca ${p}`);

  // Paso 3: tamaño (DT-01, DT-14, DT-15)
  const arbol = sh(`git ls-tree -r ${cab}`) ?? '';
  const blobs = new Map(
    [...arbol.matchAll(/^\d+ blob ([0-9a-f]+)\t(.+)$/gm)].map((m) => [m[2], m[1]]),
  );
  const nuevos = new Set(estados.filter((c) => c[0] === 'A').map((c) => c[1]));
  const archivos = t.leerNumstat(sh(`git diff --numstat ${rango}`) ?? '').map((a) => {
    const blob = blobs.get(a.ruta);
    return { ...a, nuevo: nuevos.has(a.ruta), ...(blob ? { blob } : {}) };
  });
  const fuentes = [
    ...t.fuentesDeAnexos(arbol),
    ...t.fuentesDeBloques(
      [...arbol.matchAll(/\t(docs\/0\d-[^/]+\.md)$/gm)].map(([, d = '']) => ({
        nombre: d,
        texto: show(cab, d),
      })),
    ),
    ...(op.entrada ? t.fuentesDeCarpeta(op.entrada) : []),
  ];
  const cubre = (ficha['cubre'] ?? '').split(',').map((s) => s.trim());
  const excepciones = t.excepcionesDe(show(base, 'tools/plan/verificar.ts'));
  const m = t.medir(
    archivos,
    { id: tarea, cubre, excepcion: ficha['excepcion'] ?? '' },
    { fuentes, excepciones },
  );
  out(
    3,
    `tamaño medido: prod=${m.prod} archivos=${m.archivos} ca=${m.ca} migraciones=${m.migraciones} total=${m.total}`,
  );
  out(3, `tamaño declarado: ${ficha['tamano'] ?? '—'}`);
  for (const p of m.portados) out(3, `portado: ${p.ruta} ← ${p.fuente} (huella ${p.huella})`);
  fallas.push(...m.errores.map((x) => 'paso 3: ' + x));

  // Paso 4: revisión obligatoria por la ficha y por los archivos (DT-05)
  const criticos = m.detalle.flatMap((d) => {
    const area = d.ruta.startsWith('docs/') ? undefined : AREAS.find(([, re]) => re.test(d.ruta));
    return area ? [`${area[0]}: ${d.ruta} (+${d.agregadas} −${d.borradas}, ${d.clase})`] : [];
  });
  if (/^[+-]\s*"ci:/m.test(sh(`git diff -U0 ${rango} -- package.json`) ?? ''))
    criticos.push('CI y workflows: package.json (scripts ci:*)');
  const obligatoria = ficha['revision'] === 'obligatoria' || criticos.length > 0;
  out(4, `revisión ${obligatoria ? 'obligatoria' : 'normal'} (ficha: ${ficha['revision'] ?? '—'})`);
  for (const c of criticos) out(4, 'área crítica: ' + c);
  const faltaAprobacion = obligatoria && !op.aprobado;
  if (faltaAprobacion)
    out(4, 'revisión obligatoria: el merge exige --aprobado tras el "mergeá" del usuario');

  // Paso 5: resumen (07 §22.2, RS7-09, DT-07, 07 §31.5)
  for (const l of [...fichas.lineas, ...lineasResumen(resumenPendientes(base5, e))]) out(5, l);
  const viejos = archivos.filter((a) => !a.nuevo);
  const pruebas = viejos.filter((a) => t.clasificar(a.ruta) === 'prueba').map((a) => a.ruta);
  const quitado = pruebas.length ? (sh(`git diff -U0 ${rango} --`, ...pruebas) ?? '') : '';
  const ids = quitado
    .split('\n')
    .flatMap((l) => (/^-(?!--)/.test(l) ? (l.match(/PRU-[A-Z0-9@-]+/g) ?? []) : []));
  const datos = viejos.filter((a) => /(^|\/)(escenarios\/datos|__datos__|muestras)\//.test(a.ruta));
  const cambiadas = [...new Set(ids)]
    .map((x) => `título o expectativa de ${x}`)
    .concat(datos.map((a) => `datos ${a.ruta}`));
  out(5, `pruebas cuyo título o datos cambiaron (RS7-09): ${cambiadas.join('; ') || 'ninguna'}`);
  const act = sh(
    `gh api repos/{owner}/{repo}/activity?ref=refs/heads/${pr['headRefName']}&per_page=100`,
  );
  const pushes = act
    ? (JSON.parse(act) as { activity_type: string }[]).filter((x) =>
        /push|branch_creation/.test(x.activity_type),
      ).length
    : NaN;
  out(
    5,
    `pushes: ${Number.isNaN(pushes) ? '? (gh api falló)' : pushes}${pushes > 2 ? ' (DT-07: máximo 2)' : ''}`,
  );
  out(5, 'despliegue de emergencia pendiente: ' + emergencia(e.resultadosManuales, sh));

  // Paso 6: merge
  if (fallas.length)
    return { codigo: 1, salida: [...salida, ...fallas.map((f) => 'FALLA ' + f), 'NO SE MERGEA'] };
  if (op.dryRun || op.resumen)
    return {
      codigo: faltaAprobacion ? 3 : 0,
      salida: [
        ...salida,
        `listo${faltaAprobacion ? ' salvo --aprobado' : ''}; el paso 6 (merge) no se ejecutó`,
      ],
    };
  if (faltaAprobacion) return { codigo: 1, salida: [...salida, 'NO SE MERGEA: falta --aprobado'] };
  const cuerpo = `Tarea: ${tarea}${obligatoria ? '\nAprobado-por: usuario' : ''}`;
  const r = run('gh', [
    'pr',
    'merge',
    n,
    '--squash',
    '--match-head-commit',
    cab,
    '--subject',
    `${titulo} (#${n})`,
    '--body',
    cuerpo,
  ]);
  return {
    codigo: r.status ? 1 : 0,
    salida: [
      ...salida,
      r.status
        ? `gh pr merge falló: ${r.stderr.trim()}`
        : `mergeado (${cuerpo.replace('\n', '; ')})`,
    ],
  };
}

/** 07 §31.5: el último despliegue de emergencia (sin contar ensayos) sigue pendiente hasta una corrida verde de main que lo contenga. */
function emergencia(
  resultados: string,
  sh: (linea: string, ...extra: string[]) => string | null,
): string {
  const filas = resultados.split('\n').map((l) => l.split('|').map((x) => x.trim()));
  const [, , fecha, , , , commit = ''] =
    filas
      .filter((c) => c[1] === 'PRU-MAN-OPER-002' && !/ensayo/i.test(c[7] ?? ''))
      .sort((a, b) => `${a[2]}`.localeCompare(`${b[2]}`))
      .at(-1) ?? [];
  if (!fecha) return 'ninguno';
  const corridas = sh(
    'gh run list --workflow ci.yml --branch main --status success --json headSha --limit 50',
  );
  if (corridas === null) return `sin comprobar: commit ${commit} del ${fecha} (gh run list falló)`;
  const verde = (JSON.parse(corridas) as { headSha: string }[]).some(
    (c) => sh(`git merge-base --is-ancestor ${commit} ${c.headSha}`) !== null,
  );
  return verde ? 'ninguno' : `commit ${commit} del ${fecha}, sin corrida completa de main en verde`;
}

if (import.meta.main) {
  const a = process.argv.slice(2);
  const numero = Number(a.find((x) => /^\d+$/.test(x)));
  if (!numero) {
    console.error('uso: pnpm pr:mergear <número> [--aprobado] [--dry-run] [--resumen] [--sin-ci]');
    process.exit(2);
  }
  const run: Run = (cmd, args) => {
    const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 << 20 });
    return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  const f = (x: string): boolean => a.includes(x);
  const op = {
    aprobado: f('--aprobado'),
    dryRun: f('--dry-run'),
    resumen: f('--resumen'),
    sinCi: f('--sin-ci'),
  };
  const r = mergear(
    { numero, ...op, entrada: process.env['FINN_ENTRADA'] ?? 'C:/finn/_entrada' },
    run,
  );
  console.log(op.resumen ? '```text\n' + r.salida.join('\n') + '\n```' : r.salida.join('\n'));
  process.exit(r.codigo);
}
