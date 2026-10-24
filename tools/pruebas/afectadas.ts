// tools/pruebas/afectadas.ts — `pnpm pruebas:afectadas` (07 §13.6, DP-19): de archivos cambiados a fichas y a filtros de
// pruebas. Orden: Piezas de 06 (CH-01), `mapa-codigo.json`, `marco` y las pruebas de los archivos de prueba cambiados.
import { spawnSync } from 'node:child_process';
import { bloques } from './documentos.ts';
import { comandos, porFeature } from './ft.ts';
import { globARegex, PATRON_CONSULTA, PATRON_OP } from './reglas.ts';
import { cargarEntradas, verificar } from './matriz.ts';
import type { Entradas, Prueba, Resultado } from './matriz.ts';

export interface Piezas {
  ft: string;
  ops: string[];
  consultas: string[];
  rutas: string[];
}

/** Operaciones, consultas y rutas del bloque **Piezas.** de cada ficha de 06. */
export function piezas(d06: string): Piezas[] {
  return bloques(d06).map(({ ft, b }) => {
    const sec = b.split('**Piezas.**')[1]?.split(/\n\*\*[A-Z]/)[0] ?? '';
    const linea = (n: string): string => sec.match(new RegExp(`^- ${n}:(.*)$`, 'm'))?.[1] ?? '';
    const todos = (t: string, re: RegExp): string[] => [...t.matchAll(re)].map((m) => m[1] ?? '');
    return {
      ft,
      ops: todos(linea('Operaciones'), /\bOP-(\d{2})\b/g).map((n) => `OP-${n}`),
      consultas: todos(linea('Consultas'), /`([A-Za-z]\w*)/g),
      rutas: todos(linea('Rutas'), /`(?:[A-Z]+ )?(\/[^`\s,;]*)/g).map((r) => r.replace(/\/$/, '')),
    };
  });
}

/** Ruta de Next de un archivo de `apps/web/src/app`, sin los grupos `(finn)`; null si no es de una ruta. */
function rutaDe(archivo: string): string | null {
  const m = archivo.match(/^apps\/web\/src\/app\/(.*)$/);
  if (!m) return null;
  const dir = (m[1] ?? '').split('/').slice(0, -1);
  const segs = dir.filter((s) => !/^\(.*\)$/.test(s));
  return segs.length ? '/' + segs.join('/') : '';
}

/** Punto 1 de 07 §13.6: fichas que citan la pieza a la que corresponde el archivo (vacío si no es una pieza). */
export function fichasPorPiezas(archivo: string, ps: Piezas[]): string[] {
  const op = archivo.match(PATRON_OP)?.[1];
  if (op) return ps.filter((p) => p.ops.includes(`OP-${op}`)).map((p) => p.ft);
  const consulta = archivo.match(PATRON_CONSULTA)?.[1];
  if (consulta) return ps.filter((p) => p.consultas.includes(consulta)).map((p) => p.ft);
  const ruta = rutaDe(archivo);
  if (ruta === null) return [];
  // la ruta más específica que contiene al archivo; la raíz `/` solo toma los archivos de la raíz
  const cand = ps.flatMap((p) =>
    p.rutas
      .filter((r) => r === ruta || (r !== '' && ruta.startsWith(r + '/')))
      .map((r) => ({ ft: p.ft, largo: r.length })),
  );
  const mayor = Math.max(-1, ...cand.map((c) => c.largo));
  return cand.filter((c) => c.largo === mayor).map((c) => c.ft);
}

export function afectadas(e: Entradas, r: Resultado, cambiados: string[]) {
  const ps = piezas(e.d06);
  const fts = new Set<string>();
  let todo = false;
  for (const f of cambiados) {
    const deMapa = e.mapa.filter((m) => globARegex(m.patron).test(f));
    if (deMapa.some((m) => m.fts === 'marco')) todo = true;
    const porPiezas = fichasPorPiezas(f, ps);
    const resueltas = porPiezas.length
      ? porPiezas
      : deMapa.flatMap((m) => (m.fts === 'marco' ? [] : m.fts));
    for (const ft of resueltas) fts.add(ft);
  }
  const pruebas = new Map<string, Prueba>();
  for (const ft of fts) for (const p of porFeature(r, ft).pruebas) pruebas.set(p.id, p);
  // las pruebas de los archivos de prueba que cambiaron se agregan siempre
  for (const p of r.activas) if (cambiados.includes(p.archivo)) pruebas.set(p.id, p);
  const lista = [...pruebas.values()];
  const e2e = lista.filter((p) => ['E2E', 'SW'].includes(p.nivel)).map((p) => p.id);
  return {
    todo,
    fts: [...fts].sort(),
    grepE2E: todo ? null : e2e.length ? e2e.join('|') : '^$',
    comandos: comandos(lista.filter((p) => !['E2E', 'SW'].includes(p.nivel))),
    total: lista.length,
  };
}

if (import.meta.main) {
  let cambiados = process.argv.slice(2);
  if (!cambiados.length) {
    const g = spawnSync('git', ['diff', '--name-only', 'origin/main...'], { encoding: 'utf8' });
    cambiados = g.stdout.split('\n').filter(Boolean);
  }
  const e = cargarEntradas();
  console.log(JSON.stringify(afectadas(e, verificar(e), cambiados), null, 1));
}
