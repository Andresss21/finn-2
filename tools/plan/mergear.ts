// tools/plan/mergear.ts — `pnpm pr:mergear <n> [--aprobado] [--dry-run] [--resumen] [--sin-ci]` (TA-010; 07 §6.3, §22.2,
// §31.5, RS7-09; 08 DT-01, DT-05, DT-06, DT-07). Pasos: 1 checks, 2 archivos del usuario, 3 tamaño, 4 revisión
// obligatoria, 5 resumen, 6 `gh pr merge --squash`. `--dry-run` y `--resumen` (Markdown) hacen 1 a 5 y nunca mergean.
// `--sin-ci` acepta un PR sin ningún check, solo hasta que TA-012 traiga ci.yml, y lo deja escrito en la salida.
// Sale con 0 (listo o mergeado), 1 (no se mergea) o 3 (con --dry-run o --resumen: todo en orden salvo --aprobado).
// TA-014: "Qué mirar" obligatorio, el resumen de 08 §1.5 (resumen-revision.ts), DT-20, la aprobación de DT-33
// (aprobacion.ts; `--aprobado --terminal`) y `--excepcion-tamano "<motivo>"` (CH-15).
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import type { Entradas } from '../pruebas/matriz.ts';
import { lineasResumen, resumenPendientes } from '../pruebas/pendientes.ts';
import { resumen } from '../pruebas/resumen.ts';
import * as ap from './aprobacion.ts';
import { leerFichas } from './encargo.ts';
import * as rv from './resumen-revision.ts';
import * as t from './tamano.ts';

export type Respuesta = { status: number; stdout: string; stderr: string };
export type Run = (cmd: string, args: string[]) => Respuesta;
// entrada: carpeta de la entrada de los documentos (CH-10), si existe en esta PC; terminal: la tarea que el usuario
// escribió con --terminal; aprobaciones: carpeta de DT-33 (solo las pruebas la cambian)
export type Opciones = {
  numero: number;
  aprobado: boolean;
  dryRun: boolean;
  resumen: boolean;
  sinCi: boolean;
  entrada?: string;
  terminal?: string;
  excepcionTamano?: string;
  aprobaciones?: string;
};

const DEL_USUARIO = [
  'pruebas/manuales/resultados.md',
  'pruebas/firmantes-permitidos',
  'plan/tu.md',
];
const DIFF_COMPLETO = /^(packages\/db\/prisma\/migrations\/|CLAUDE\.md$|\.claude\/settings\.json$)/;
const CHECKS = (aTerminada: boolean): [string, boolean][] => [
  ['rapido', true],
  ['cierre', aTerminada],
  ['integracion', false],
  ['e2e', false],
];

export function mergear(
  op: Opciones,
  run: Run,
): { codigo: number; salida: string[]; revision: string } {
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
  if (vista === null)
    return { codigo: 1, salida: [`no se pudo leer el PR #${n} con gh pr view`], revision: '' };
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
  const f = leerFichas(show(base, 'docs/08-tareas.md')).find((x) => x.id === tarea);
  const ficha = f?.datos ?? {};
  salida.push(`pr:mergear #${n} — ${titulo}`);
  // "Qué mirar:" con su texto en la misma línea o en las siguientes, hasta el próximo campo del informe
  const campo = /^Qué mirar:(.*(?:\n(?![A-ZÁÉÍÓÚ][\wáéíóúñ ]*:).*)*)/m;
  const mirar = campo.exec(pr['body'] ?? '')?.[1]?.trim() ?? '';
  if (!mirar || /^nada\b/i.test(mirar))
    fallas.push('el informe no tiene "Qué mirar:" con el archivo y lo más riesgoso (08 §1.5)');
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
  const medido = `prod=${m.prod} archivos=${m.archivos} ca=${m.ca} migraciones=${m.migraciones} total=${m.total}`;
  out(3, `tamaño medido: ${medido}`);
  out(3, `tamaño declarado: ${ficha['tamano'] ?? '—'}`);
  for (const p of m.portados) out(3, `portado: ${p.ruta} ← ${p.fuente} (huella ${p.huella})`);
  // CH-15: con un motivo, un exceso sigue; sobre el 30 % o en una obligatoria, solo con --aprobado. Migraciones no.
  const motivo = op.excepcionTamano?.trim() ?? '';
  const pedida = m.excesos.length > 0 && op.excepcionTamano !== undefined;
  const migr = m.excesos.some((x) => x.medida === 'migraciones');
  if (pedida && !motivo) fallas.push('paso 3: --excepcion-tamano necesita un motivo (CH-15)');
  if (pedida && migr) fallas.push('paso 3: el límite de migraciones no admite excepción (CH-15)');
  const vale = pedida && !!motivo && !migr;
  const medidas = m.excesos.map((x) => `${x.medida}=${x.n}/${x.lim}`).join(' ');
  const excepcion = vale ? `Excepción-tamaño: ${medidas} — ${motivo}` : '';
  if (vale) out(3, excepcion);
  const errores = m.errores.filter((x) => !vale || !x.startsWith('DT-01 '));
  fallas.push(...errores.map((x) => 'paso 3: ' + x));

  // Paso 4: revisión obligatoria por la ficha y por los archivos de producción (DT-05, DT-20)
  const criticos = m.detalle.flatMap((d) => {
    const area = t.areaCritica(d);
    return area ? [`${area}: ${d.ruta} (+${d.agregadas} −${d.borradas}, ${d.clase})`] : [];
  });
  if (/^[+-]\s*"ci:/m.test(sh(`git diff -U0 ${rango} -- package.json`) ?? ''))
    criticos.push('CI y workflows: package.json (scripts ci:*)');
  const obligatoria = ficha['revision'] === 'obligatoria' || criticos.length > 0;
  out(4, `revisión ${obligatoria ? 'obligatoria' : 'normal'} (ficha: ${ficha['revision'] ?? '—'})`);
  for (const c of criticos) out(4, 'área crítica: ' + c);
  const exige = obligatoria || (vale && m.excesos.some((x) => x.n > x.lim * 1.3));
  // DT-33: el archivo que escribe el hook con el "mergeá TA-nnn" del usuario, o la tarea escrita con --terminal
  let [aprobadoPor, archivoAprobacion] = ['', ''];
  if (op.aprobado && op.terminal !== undefined) {
    if (op.terminal.trim().toUpperCase() === tarea) aprobadoPor = 'usuario (terminal)';
    else fallas.push(`paso 4: la tarea escrita en la terminal no es ${tarea}`);
  } else if (op.aprobado) {
    const fecha = (sh(`git log -1 --format=%cI ${cab}`) ?? '').trim();
    const a = ap.leerAprobacion(tarea, fecha, op.aprobaciones);
    if (a.ok) [aprobadoPor, archivoAprobacion] = [`usuario (mensaje ${a.huella})`, a.archivo];
    else fallas.push('paso 4: aprobación (DT-33): ' + a.error);
  }
  const faltaAprobacion = exige && !op.aprobado;
  if (faltaAprobacion)
    out(
      4,
      `${obligatoria ? 'revisión obligatoria' : 'excepción de tamaño sobre el 30 %'}: el merge exige --aprobado tras el "mergeá ${tarea}" del usuario`,
    );

  // Paso 5: resumen (07 §22.2, RS7-09, DT-07, 07 §31.5) y las secciones de 08 §1.5
  for (const l of [...fichas.lineas, ...lineasResumen(resumenPendientes(base5, e))]) out(5, l);
  const dePrueba = archivos.filter((a) => t.clasificar(a.ruta) === 'prueba').map((a) => a.ruta);
  const diffPruebas = dePrueba.length ? (sh(`git diff -U0 ${rango} --`, ...dePrueba) ?? '') : '';
  const datos = archivos.filter(
    (a) => !a.nuevo && /(^|\/)(escenarios\/datos|__datos__|muestras)\//.test(a.ruta),
  );
  const patrones = rv.patrones(f?.secciones['Archivos'] ?? '');
  const revision = rv.revision({
    pruebas: rv.pruebasDelDiff(diffPruebas, (r) => show(cab, r), nuevos),
    cubre: cubre.filter((c) => c && c !== '—'),
    pru: (ficha['pru'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('PRU-')),
    datos: datos.map((a) => a.ruta),
    ...{ medido, declarado: ficha['tamano'] ?? '—', excepcion, criticos },
    portados: m.portados.map((p) => `${p.ruta} ← ${p.fuente} (huella ${p.huella})`),
    fuera: m.detalle
      .filter((d) => d.clase === 'produccion' && !patrones.some((p) => p.test(d.ruta)))
      .map((d) => d.ruta),
    deps: estados.flatMap(([, r = '']) =>
      /(^|\/)package\.json$/.test(r) ? rv.depsNuevas(show(base, r, '{}'), show(cab, r, '{}')) : [],
    ),
    normalCritica: ficha['revision'] === 'normal' && criticos.length > 0,
    diffCompleto: archivos.filter((a) => DIFF_COMPLETO.test(a.ruta)).map((a) => a.ruta),
  });
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
  const fin = (codigo: number, ...l: string[]) => ({ codigo, salida: [...salida, ...l], revision });
  if (fallas.length) return fin(1, ...fallas.map((x) => 'FALLA ' + x), 'NO SE MERGEA');
  if (op.dryRun || op.resumen)
    return fin(
      faltaAprobacion ? 3 : 0,
      `listo${faltaAprobacion ? ' salvo --aprobado' : ''}; el paso 6 (merge) no se ejecutó`,
    );
  if (faltaAprobacion) return fin(1, 'NO SE MERGEA: falta --aprobado');
  const cuerpo = [`Tarea: ${tarea}`, aprobadoPor && `Aprobado-por: ${aprobadoPor}`, excepcion]
    .filter(Boolean)
    .join('\n');
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
  if (!r.status && archivoAprobacion) ap.consumirAprobacion(archivoAprobacion);
  return fin(
    r.status ? 1 : 0,
    r.status
      ? `gh pr merge falló: ${r.stderr.trim()}`
      : `mergeado (${cuerpo.replaceAll('\n', '; ')})`,
  );
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
  const iExc = a.indexOf('--excepcion-tamano');
  const numero = Number(a.find((x, i) => /^\d+$/.test(x) && (iExc < 0 || i !== iExc + 1)));
  if (!numero) {
    console.error(
      'uso: pnpm pr:mergear <número> [--aprobado [--terminal]] [--dry-run] [--resumen] [--sin-ci] [--excepcion-tamano "<motivo>"]',
    );
    process.exit(2);
  }
  let terminal: string | undefined;
  if (a.includes('--terminal')) {
    if (!a.includes('--aprobado') || !ap.puedePreguntar(process.env, !!process.stdin.isTTY)) {
      console.error(
        '--terminal va con --aprobado, en una terminal interactiva y fuera de Claude Code',
      );
      process.exit(2);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    terminal = await rl.question(`Para aprobar el PR #${numero}, escribí su tarea (TA-nnn): `);
    rl.close();
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
  const entrada = process.env['FINN_ENTRADA'] ?? 'C:/finn/_entrada';
  const excepcionTamano = iExc >= 0 ? (a[iExc + 1] ?? '') : undefined;
  const r = mergear({ numero, ...op, entrada, terminal, excepcionTamano }, run);
  const texto = r.salida.join('\n');
  console.log(
    op.resumen ? `${r.revision}\n\n### Comprobaciones\n\n\`\`\`text\n${texto}\n\`\`\`` : texto,
  );
  process.exit(r.codigo);
}
