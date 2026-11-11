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

/** `terminadas`: las fichas que el PR pasa a `terminada`. Con alguna corre `cierre`, y M15 exige el resultado de todas
 * las fichas terminadas: la E2E corre completa (07 §13.2, paso 4; CH-70). `sinMarco`: el modo corto de `ci:local`
 * (CH-231) no expande el marco a la suite completa; esa queda para la CI del PR. */
export function afectadas(
  e: Entradas,
  r: Resultado,
  cambiados: string[],
  terminadas: string[] = [],
  sinMarco = false,
) {
  const ps = piezas(e.d06);
  const fts = new Set<string>(terminadas);
  let todo = terminadas.length > 0;
  for (const f of cambiados) {
    const deMapa = e.mapa.filter((m) => globARegex(m.patron).test(f));
    if (!sinMarco && deMapa.some((m) => m.fts === 'marco')) todo = true;
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
  // 07 §2.3: `REN` web es una prueba de Playwright (`.e2e.ts`), no un `vitest bench` (TA-222)
  const esE2e = (p: Prueba): boolean =>
    ['E2E', 'SW'].includes(p.nivel) || p.archivo.endsWith('.e2e.ts');
  const e2e = lista.filter(esE2e).map((p) => p.id);
  return {
    todo,
    fts: [...fts].sort(),
    grepE2E: todo ? null : e2e.length ? e2e.join('|') : '^$',
    comandos: comandos(lista.filter((p) => !esE2e(p))),
    total: lista.length,
  };
}

// CH-239: clases de diff para elegir la E2E (07 §6.1), de menor a mayor; un diff es de la clase más alta de sus archivos.
// 0: documentos y plan, sin E2E y sin subir la clase. 1: estilos. 2: pantallas, flujos y textos propios y sus pruebas,
// sin lo que el mapa da como `marco`. 3: todo lo demás, también lo que no se sabe clasificar.
export type Clase = 0 | 1 | 2 | 3;
export type Mapa = Entradas['mapa'];
const DOC = /^(docs\/|plan\/|pruebas\/(features|mapa-codigo)\.json$|pruebas\/manuales\.md$)/;
const ESTILO = /^apps\/web\/(src\/app\/(tokens\.(css|json)|globals\.css)|tailwind\.css)$/;
const PROPIO =
  /^apps\/web\/(src\/(app\/(?!api\/)|flujos\/)|e2e\/(?!ayudas\/|configuracion\/).+\.e2e\.ts$)/;
// textos/** es `marco` en el mapa; son propios los de una pantalla o un flujo, no los compartidos
const TEXTO_PROPIO =
  /^apps\/web\/src\/textos\/(?!(index|base|dominio|estados|formularios|glosario|navegacion)\.ts$)[\w-]+\.ts$/;
/** Las de la clase 1: axe con contraste, tamaño táctil y reflujo a 320 px en cada ruta; movimiento reducido; tamaño
 * de JS. El contraste de tokens (PRU-DOM-PWA-001) corre siempre en `rapido`. */
export const E2E_ESTILOS = ['PRU-E2E-PWA-007', 'PRU-E2E-PWA-008', 'PRU-REN-PWA-002'];
/** Además, en la clase 2: ingresar de punta a punta y cada ruta real de (finn) sin sesión, con AAL1 y con AAL2. */
export const E2E_ACCESO = ['PRU-E2E-ACCESO-102', 'PRU-SEG-ACCESO-002'];

export function clase(archivo: string, mapa: Mapa): Clase {
  if (DOC.test(archivo)) return 0;
  if (ESTILO.test(archivo)) return 1;
  if (TEXTO_PROPIO.test(archivo)) return 2;
  const marco = mapa.some((m) => m.fts === 'marco' && globARegex(m.patron).test(archivo));
  return PROPIO.test(archivo) && !marco ? 2 : 3;
}

export const claseDe = (archivos: string[], mapa: Mapa): Clase =>
  Math.max(0, ...archivos.map((a) => clase(a, mapa))) as Clase;

/** El filtro `-g` de una clase. `grep`: el de `afectadas` (sin el marco en las clases 1 y 2); null es la suite completa
 * (una ficha que se cierra, CH-70, o el marco en la clase 3) y manda en cualquier clase. */
export function seleccionE2E(c: Clase, grep: string | null): string {
  if (grep === null) return 'todas';
  if (c === 0 || c === 3) return c === 0 ? '^$' : grep;
  const propias = c === 2 && grep !== '^$' ? grep.split('|') : [];
  return [...new Set([...propias, ...E2E_ESTILOS, ...(c === 2 ? E2E_ACCESO : [])])].join('|');
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
