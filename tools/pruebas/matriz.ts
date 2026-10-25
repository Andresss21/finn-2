// tools/pruebas/matriz.ts — matriz de trazabilidad (07 §13): lectura de los documentos, inventario y reglas M7, M8, M12 y M13
// (TA-006); las reglas de cobertura M1 a M6, M9 a M11 y M14 (TA-007), M15 y M16 (TA-009) viven en reglas.ts y M18 en
// pendientes.ts (TA-015). M17 es tools/pruebas/firmas.sh (TA-009).
// Portado del prototipo de V7-09/V7-11. Node 24 lo ejecuta sin compilar (solo sintaxis borrable, sin dependencias).
//   node tools/pruebas/matriz.ts verificar [--puerta] [--resultados <dir>]   sale con 1 si alguna regla falla (job
//     `rapido`; nocturno con --puerta; job `cierre` con --resultados: informes JSON de Vitest y Playwright, M15)
//   node tools/pruebas/matriz.ts informe                cobertura por ficha y estado de la puerta
// Entradas (cambiables con FINN_MATRIZ_*): docs/{01-dominio,04-backend,05-frontend,06-features}.md,
// pruebas/{inventario,features,mapa-codigo,cuarentena,verificaciones-previas,pendientes-e2e}.json, pruebas/manuales.md
// y pruebas/manuales/resultados.md.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cambiosFuturos, fichas, objetivos } from './documentos.ts';
import type { Documentos } from './documentos.ts';
import { cobertura, globARegex, PATRON_CONSULTA, PATRON_OP, REF } from './reglas.ts';
import type { Cuarentena, Previa } from './reglas.ts';
import { ES_CA, pendientesE2e } from './pendientes.ts';
import type { Pendiente } from './pendientes.ts';

export type EstadoFt = 'pendiente' | 'en_curso' | 'terminada';
export type EstadoCorrida = 'pasada' | 'fallida' | 'omitida';
export interface Prueba {
  id: string;
  nivel: string;
  area: string;
  refs: string[];
  archivo: string;
}
export interface Entradas extends Documentos {
  inventario: { titulo: string; archivo: string }[];
  features: Record<string, EstadoFt | 'pendiente_e2e'>; // FT-nn → estado; CA-nn.m → pendiente_e2e (M18)
  pendientes: Pendiente[]; // pruebas/pendientes-e2e.json (CH-08)
  mapa: { patron: string; fts: string[] | 'marco' }[];
  manuales: string; // pruebas/manuales.md
  resultadosManuales: string; // pruebas/manuales/resultados.md (M16); solo lo escribe el usuario, firmado (M17)
  resultados?: Record<string, EstadoCorrida>; // de `--resultados <dir>` (M15); sin él, M15 mira solo la cuarentena
  previas: Previa[] | null; // null: todavía no existe pruebas/verificaciones-previas.json (TA-008)
  cuarentena: Cuarentena[];
  hoy: string; // AAAA-MM-DD
  puerta: boolean;
  codigo: string[]; // archivos de apps/web/src y packages/*/src, relativos a la raíz y con `/`
}

// Niveles de 07 §1.1 y áreas de 07 §2.2
const NIVELES = 'DOM ESC PROP CTR INT ESQ RH CMP E2E REN SEG SW RES MAN'.split(' ');
const AREAS = (
  'ACCESO INICIO PRES CATEG META TX DEV TARJ BAND PROG CONC COBRO CTA REP NOTIF AJUS PWA ' +
  'MOTOR VAL RELOJ POOL ESQ RESP OPER'
).split(' ');
// Dónde puede vivir cada nivel (07 §2.3): una prueba en el archivo equivocado es un error de la matriz
const ARCHIVO_DE: Record<string, RegExp> = {
  DOM: /\.test\.ts$/,
  PROP: /\.prop\.test\.ts$/,
  CTR: /\.ctr\.test\.ts$/,
  INT: /\.int\.test\.ts$/,
  ESQ: /(\.int\.test\.ts|tools\/db\/)/,
  RH: /\.rh\.test\.ts$/,
  CMP: /\.cmp\.test\.tsx$/,
  E2E: /\.e2e\.ts$/,
  SW: /\/sw\/.*\.e2e\.ts$/,
  REN: /(\.bench\.ts|\/rendimiento\/.*\.e2e\.ts)$/,
  RES: /tools\/respaldo\/test\//,
  SEG: /./,
  'ESC@motor': /escenarios\//,
  'ESC@int': /\.int\.test\.ts$/,
};
const TITULO =
  /^(PRU-(?:ESC-\d{2}@(motor|int)|([A-Z0-9]+)-([A-Z]+)-(\d{3})))(?:\s+\[([^\]]*)\])?\s+(.+)$/;
const DECISION =
  /^([A-Z]{1,2}\d{1,2}[a-z]?|[A-Z]-\d{1,2}|supuesto \d+|ajuste \d|error \d+|inv\. \d+|fila \d+|R\d+)$/;
const ES_PRUEBA = /\.(test|e2e)\.tsx?$|\.bench\.ts$/;
// Las pruebas de las herramientas del repositorio (lint, plan, matriz) no son pruebas de Finn y no llevan PRU-
const HERRAMIENTA = /^tools\/(?!respaldo\/test\/)/;

// ---------------------------------------------------------------- inventario de pruebas (M7, M8)
export function pruebas(e: Entradas): { lista: Prueba[]; errores: string[] } {
  const lista: Prueba[] = [];
  const errores: string[] = [];
  for (const { titulo: t0, archivo } of e.inventario) {
    const titulo = t0.split(' > ').pop() ?? ''; // Vitest une los describe con " > "
    if (!titulo.startsWith('PRU-')) {
      if (ES_PRUEBA.test(archivo) && !HERRAMIENTA.test(archivo))
        errores.push(`M8 prueba sin identificador: "${titulo}" (${archivo})`);
      continue;
    }
    const m = titulo.match(TITULO);
    if (!m) {
      errores.push(`M8 título mal formado: "${titulo}"`);
      continue;
    }
    const [, id, ejecutor, nivel = 'ESC', area = 'MOTOR', , corchetes = ''] = m as string[];
    if (!NIVELES.includes(nivel)) errores.push(`M8 nivel desconocido ${nivel} en ${id}`);
    if (!AREAS.includes(area)) errores.push(`M8 área desconocida ${area} en ${id}`);
    if (!(ARCHIVO_DE[ejecutor ? `ESC@${ejecutor}` : nivel] ?? /./).test(archivo))
      errores.push(`M8 ${id} es ${nivel} y está en ${archivo}`);
    const refs = corchetes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const x of refs)
      if (!REF.test(x) && !DECISION.test(x))
        errores.push(`M7 referencia con formato desconocido "${x}" en ${id}`);
    lista.push({ id: id ?? '', nivel, area, refs: refs.filter((x) => REF.test(x)), archivo });
  }
  const vistos = new Map<string, string>();
  for (const p of lista) {
    const antes = vistos.get(p.id);
    if (antes !== undefined && antes !== p.archivo)
      errores.push(`M8 identificador repetido ${p.id} en ${antes} y ${p.archivo}`);
    vistos.set(p.id, p.archivo);
  }
  return { lista, errores };
}

// ---------------------------------------------------------------- reglas
export function verificar(e: Entradas) {
  const { lista, errores } = pruebas(e);
  const fs = fichas(e.d06);
  const ids = new Set([
    ...objetivos(e).map((o) => o.id),
    ...cambiosFuturos(e.d06),
    ...fs.map((f) => f.ft),
  ]);
  const cob = cobertura(e, lista, ids);
  const { cubre, obj } = cob;
  errores.push(...cob.errores);
  const avisos = cob.avisos;
  // M18 pendientes de punta a punta (CH-08)
  const pen = pendientesE2e(e, cob.activas, obj);
  errores.push(...pen.errores);
  avisos.push(...pen.avisos);
  // M7 toda referencia citada existe en los documentos
  for (const p of lista)
    for (const x of p.refs)
      if (!ids.has(x)) errores.push(`M7 ${p.id} cita ${x}, que no existe en los documentos`);
  // M12 cada archivo de código de la app pertenece a alguna feature o al marco, o se resuelve por las Piezas (CH-01)
  const patrones = e.mapa.map((m) => globARegex(m.patron));
  for (const f of e.codigo)
    if (!patrones.some((re) => re.test(f)) && !PATRON_OP.test(f) && !PATRON_CONSULTA.test(f))
      errores.push(`M12 ${f} no está en pruebas/mapa-codigo.json`);
  // M13 features.json solo cita fichas que existen; la diferida no sale de pendiente
  for (const [ft, st] of Object.entries(e.features)) {
    if (ES_CA.test(ft)) continue; // las marcas pendiente_e2e de los CA las revisa M18
    const f = fs.find((x) => x.ft === ft);
    if (!f) errores.push(`M13 pruebas/features.json cita ${ft}, que no tiene ficha`);
    else if (f.diferida && st !== 'pendiente')
      errores.push(`M13 ${ft} está diferida en 06; no puede estar ${st} sin el CT que la active`);
  }
  // M13 (aviso): un CA con pruebas en una ficha pendiente
  for (const o of obj)
    if (
      o.tipo === 'CA' &&
      !o.diferida &&
      cubre.has(o.id) &&
      (e.features[o.ft ?? ''] ?? 'pendiente') === 'pendiente'
    )
      avisos.push(`M13 ${o.id} tiene pruebas y ${o.ft} sigue pendiente en pruebas/features.json`);
  return {
    errores,
    avisos,
    obj,
    lista,
    cubre,
    activas: cob.activas,
    man: cob.man,
    manualesPendientes: cob.manualesPendientes,
  };
}
export type Resultado = ReturnType<typeof verificar>;

/** Cobertura por ficha y estado de la puerta (P7-8): con un manual pendiente (M16) la ficha no cumple. */
export function informe(r: Resultado) {
  const fts = [...new Set(r.obj.flatMap((o) => (o.tipo === 'CA' && o.ft ? [o.ft] : [])))].sort();
  const filas = fts.map((ft) => {
    const cas = r.obj.filter((o) => o.tipo === 'CA' && o.ft === ft);
    const cubiertos = cas.filter((c) => r.cubre.get(c.id)?.length).length;
    const pendientes = r.manualesPendientes.get(ft) ?? [];
    const estado = cas[0]?.diferida
      ? 'diferida'
      : pendientes.length
        ? 'manual pendiente'
        : cubiertos === cas.length
          ? 'cubierta'
          : 'falta';
    return { ft, prioridad: cas[0]?.prioridad, cas: cas.length, cubiertos, estado, pendientes };
  });
  const faltan = r.obj
    .filter(
      (o) => o.tipo === 'CA' && o.prioridad !== 'P' && !o.diferida && !r.cubre.get(o.id)?.length,
    )
    .map((o) => o.id);
  const conManual = filas
    .filter((f) => f.prioridad !== 'P' && f.estado === 'manual pendiente')
    .map((f) => f.ft);
  return {
    filas,
    puertaAbierta: faltan.length === 0 && conManual.length === 0,
    faltanParaLaPuerta: faltan,
    fichasConManualPendiente: conManual,
  };
}

// ---------------------------------------------------------------- entradas desde el disco
const json = (t: string): unknown => JSON.parse(t);
const leer = (p: string, d = ''): string => (existsSync(p) ? readFileSync(p, 'utf8') : d);

/** Archivos de código de `apps/web/src` y `packages/*\/src`, sin las pruebas (07 §13.3, M12). */
export function archivosDeCodigo(raiz = '.'): string[] {
  const sal: string[] = [];
  const bajar = (dir: string): void => {
    if (!existsSync(`${raiz}/${dir}`)) return;
    for (const d of readdirSync(`${raiz}/${dir}`, { withFileTypes: true })) {
      if (d.isDirectory()) bajar(`${dir}/${d.name}`);
      else if (
        /\.(ts|tsx|mjs|css)$/.test(d.name) &&
        !ES_PRUEBA.test(d.name) &&
        !d.name.endsWith('.d.ts')
      )
        sal.push(`${dir}/${d.name}`);
    }
  };
  bajar('apps/web/src');
  for (const p of existsSync(`${raiz}/packages`) ? readdirSync(`${raiz}/packages`) : [])
    bajar(`packages/${p}/src`);
  return sal.sort();
}

interface Spec {
  title: string;
  ok: boolean;
  tests?: { status: string }[];
}
interface Suite {
  specs?: Spec[];
  suites?: Suite[];
}
/** Resultados de la corrida (M15): los informes JSON de Vitest (`--reporter=json`) y de Playwright de un directorio. */
export function resultadosCorrida(dir: string): Record<string, EstadoCorrida> {
  const sal: Record<string, EstadoCorrida> = {};
  // Si una prueba aparece varias veces (proyectos o navegadores), cuenta la peor: fallida > omitida > pasada
  const peso = { pasada: 0, omitida: 1, fallida: 2 } as const;
  const poner = (titulo: string, st: EstadoCorrida): void => {
    const k = titulo.split(' > ').pop()?.split(' ')[0] ?? '';
    const antes = sal[k];
    if (k.startsWith('PRU-') && (antes === undefined || peso[st] > peso[antes])) sal[k] = st;
  };
  const bajar = (s: Suite): void => {
    for (const sp of s.specs ?? []) {
      const ok = (sp.tests ?? []).every((t) => t.status === 'expected' || t.status === 'flaky');
      poner(sp.title, sp.ok && ok ? 'pasada' : 'fallida');
    }
    for (const h of s.suites ?? []) bajar(h);
  };
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const j = json(readFileSync(join(dir, f), 'utf8')) as {
      testResults?: { assertionResults?: { fullName?: string; title: string; status: string }[] }[];
      suites?: Suite[];
    };
    for (const t of j.testResults ?? [])
      for (const a of t.assertionResults ?? [])
        poner(
          a.fullName ?? a.title,
          a.status === 'passed' ? 'pasada' : a.status === 'failed' ? 'fallida' : 'omitida',
        );
    for (const s of j.suites ?? []) bajar(s);
  }
  return sal;
}

export function cargarEntradas(raiz = '.', puerta = false, resultados?: string): Entradas {
  const env = (k: string, d: string): string => process.env['FINN_MATRIZ_' + k] ?? `${raiz}/${d}`;
  const features = leer(env('FEATURES', 'pruebas/features.json'), '{}');
  return {
    d01: leer(env('D01', 'docs/01-dominio.md')),
    d04: leer(env('D04', 'docs/04-backend.md')),
    d05: leer(env('D05', 'docs/05-frontend.md')),
    d06: leer(env('D06', 'docs/06-features.md')),
    inventario: json(
      leer(env('INVENTARIO', 'pruebas/inventario.json'), '[]'),
    ) as Entradas['inventario'],
    features: json(features) as Entradas['features'],
    pendientes: json(
      leer(env('PENDIENTES', 'pruebas/pendientes-e2e.json'), '[]'),
    ) as Entradas['pendientes'],
    mapa: json(leer(env('MAPA', 'pruebas/mapa-codigo.json'), '[]')) as Entradas['mapa'],
    manuales: leer(env('MANUALES', 'pruebas/manuales.md')),
    resultadosManuales: leer(env('RESULTADOS_MANUALES', 'pruebas/manuales/resultados.md')),
    ...(resultados === undefined ? {} : { resultados: resultadosCorrida(resultados) }),
    previas: existsSync(env('PREVIAS', 'pruebas/verificaciones-previas.json'))
      ? (json(leer(env('PREVIAS', 'pruebas/verificaciones-previas.json'))) as Previa[])
      : null,
    cuarentena: json(leer(env('CUARENTENA', 'pruebas/cuarentena.json'), '[]')) as Cuarentena[],
    hoy: process.env['FINN_MATRIZ_HOY'] ?? new Date().toISOString().slice(0, 10),
    puerta,
    codigo: archivosDeCodigo(raiz),
  };
}

// ---------------------------------------------------------------- CLI
if (import.meta.main) {
  const [cmd = 'verificar'] = process.argv.slice(2);
  if (!['verificar', 'informe'].includes(cmd)) {
    console.error(`comando desconocido: ${cmd} (verificar, informe)`);
    process.exit(2);
  }
  const k = process.argv.indexOf('--resultados');
  const dir = k < 0 ? undefined : process.argv[k + 1];
  if (k >= 0 && (dir === undefined || !existsSync(dir))) {
    console.error('--resultados necesita un directorio con los informes JSON de la corrida');
    process.exit(2);
  }
  const e = cargarEntradas('.', process.argv.includes('--puerta'), dir);
  const r = verificar(e);
  if (cmd === 'informe') {
    const i = informe(r);
    for (const f of i.filas)
      console.log(
        `${f.ft} [${f.prioridad}] ${f.cubiertos}/${f.cas} CA: ${f.estado}` +
          (f.pendientes.length ? ` (${f.pendientes.join(', ')})` : ''),
      );
    console.log(
      `puerta ${i.puertaAbierta ? 'abierta' : 'cerrada'}: faltan ${i.faltanParaLaPuerta.length} CA [I] y [M]; ` +
        `${i.fichasConManualPendiente.length} fichas con manual pendiente`,
    );
    process.exit(0);
  }
  const n = (t: string): number => r.obj.filter((o) => o.tipo === t).length;
  const cuenta = ['CA', 'ESC', 'AV', 'INV', 'CB', 'REC', 'VER'].map((t) => `${n(t)} ${t}`);
  console.log(
    `objetivos: ${fichas(e.d06).length} fichas, ${cuenta.join(', ')}; modo ${e.puerta ? 'puerta' : 'incremental'}`,
  );
  console.log(
    `pruebas activas: ${r.activas.length}; manuales: ${r.man.length}; archivos de código: ${e.codigo.length}`,
  );
  for (const a of r.avisos) console.log('aviso  ' + a);
  for (const x of r.errores) console.log('error  ' + x);
  console.log(r.errores.length ? `FALLA: ${r.errores.length} errores` : 'PASA');
  process.exit(r.errores.length ? 1 : 0);
}
