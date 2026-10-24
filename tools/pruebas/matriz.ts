// tools/pruebas/matriz.ts — matriz de trazabilidad (07 §13), primera mitad (TA-006): lectura de los documentos,
// inventario y reglas M7, M8, M12 y M13 en modo incremental. M1 a M6, M9 a M11 y M14 a M16 llegan con TA-007.
// Portado del prototipo de V7-09/V7-11. Node 24 lo ejecuta sin compilar (solo sintaxis borrable, sin dependencias).
//   node tools/pruebas/matriz.ts verificar    sale con 1 si alguna regla falla (job `rapido`)
// Entradas (cambiables con FINN_MATRIZ_*): docs/{01-dominio,04-backend,05-frontend,06-features}.md,
// pruebas/inventario.json, pruebas/features.json y pruebas/mapa-codigo.json.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { cambiosFuturos, fichas, objetivos } from './documentos.ts';
import type { Documentos, Objetivo } from './documentos.ts';

export type EstadoFt = 'pendiente' | 'en_curso' | 'terminada';
export interface Prueba {
  id: string;
  nivel: string;
  area: string;
  refs: string[];
  archivo: string;
}
export interface Entradas extends Documentos {
  inventario: { titulo: string; archivo: string }[];
  features: Record<string, EstadoFt>;
  mapa: { patron: string; fts: string[] | 'marco' }[];
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
// Referencias válidas entre corchetes (07 §13.1); las decisiones de 00 y 01 (P1, H3, C1, Q2a…) son contexto
const REF =
  /^(CA-\d{2}\.\d{1,2}|ESC-\d{2}|AV-\d{2}|INV-\d{2}|CB-\d{2}|REC-4\.[1-6]|V-\d{2}|V5-\d{2}|V6-\d{2}|H-\d{2}|CF-\d{2}|FT-\d{2})$/;
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

// ---------------------------------------------------------------- patrones de código (M12, 07 §13.6)
export function globARegex(g: string): RegExp {
  const re = g
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0001')
    .replace(/\*\*/g, '\u0002')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0001/g, '(.*/)?')
    .replace(/\u0002/g, '.*');
  return new RegExp(`^${re}$`);
}

// ---------------------------------------------------------------- reglas
export function verificar(e: Entradas) {
  const obj: Objetivo[] = objetivos(e);
  const { lista, errores } = pruebas(e);
  const avisos: string[] = [];
  const fs = fichas(e.d06);
  const ids = new Set([...obj.map((o) => o.id), ...cambiosFuturos(e.d06), ...fs.map((f) => f.ft)]);
  // M7 toda referencia citada existe en los documentos
  const cubre = new Map<string, string[]>();
  for (const p of lista)
    for (const x of p.refs) {
      if (!ids.has(x)) errores.push(`M7 ${p.id} cita ${x}, que no existe en los documentos`);
      cubre.set(x, [...(cubre.get(x) ?? []), p.id]);
    }
  // M12 cada archivo de código de la app pertenece a alguna feature o al marco
  const patrones = e.mapa.map((m) => globARegex(m.patron));
  for (const f of e.codigo)
    if (!patrones.some((re) => re.test(f)))
      errores.push(`M12 ${f} no está en pruebas/mapa-codigo.json`);
  // M13 features.json solo cita fichas que existen; la diferida no sale de pendiente
  for (const [ft, st] of Object.entries(e.features)) {
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
  return { errores, avisos, obj, lista, cubre };
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

export function cargarEntradas(raiz = '.'): Entradas {
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
    mapa: json(leer(env('MAPA', 'pruebas/mapa-codigo.json'), '[]')) as Entradas['mapa'],
    codigo: archivosDeCodigo(raiz),
  };
}

// ---------------------------------------------------------------- CLI
if (import.meta.main) {
  const [cmd = 'verificar'] = process.argv.slice(2);
  if (cmd !== 'verificar') {
    console.error(`comando desconocido: ${cmd} (por ahora: verificar)`);
    process.exit(2);
  }
  const e = cargarEntradas();
  const r = verificar(e);
  const n = (t: string): number => r.obj.filter((o) => o.tipo === t).length;
  const cuenta = ['CA', 'ESC', 'AV', 'INV', 'CB', 'REC', 'VER'].map((t) => `${n(t)} ${t}`);
  console.log(`objetivos: ${fichas(e.d06).length} fichas, ${cuenta.join(', ')}; modo incremental`);
  console.log(
    `pruebas con identificador: ${r.lista.length}; archivos de código: ${e.codigo.length}`,
  );
  for (const a of r.avisos) console.log('aviso  ' + a);
  for (const x of r.errores) console.log('error  ' + x);
  console.log(r.errores.length ? `FALLA: ${r.errores.length} errores` : 'PASA');
  process.exit(r.errores.length ? 1 : 0);
}
