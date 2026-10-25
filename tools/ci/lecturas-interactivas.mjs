// Control L10 de 05 §1.7 (CP-3): ninguna lectura por Server Action fuera de la lista cerrada.
// 1) Las exportaciones de `servidor/lecturas/interactivas.ts` son exactamente las de la lista.
// 2) Ningún otro archivo de `apps/web/src` con 'use server' fuera de `servidor/acciones/` (escrituras).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Las dos lecturas de CP-3: `consultas.sugerencia` y `consultas.formulario({ operacion: 'devolver', busqueda })`.
export const LISTA_CERRADA = ['sugerencia', 'buscarComprasDevolucion'];

const RAIZ_WEB = 'apps/web/src';
const INTERACTIVAS = `${RAIZ_WEB}/servidor/lecturas/interactivas.ts`;
const ACCIONES = `${RAIZ_WEB}/servidor/acciones/`;
const USE_SERVER = /^\s*(['"])use server\1/m;

function* fuentes(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) yield* fuentes(ruta);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) yield ruta;
  }
}

export function exportaciones(texto) {
  const nombres = new Set();
  for (const m of texto.matchAll(
    /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm,
  ))
    nombres.add(m[1]);
  for (const m of texto.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const parte of m[1].split(',')) {
      const nombre = parte
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (nombre) nombres.add(nombre);
    }
  if (/^export\s+default\b/m.test(texto)) nombres.add('default');
  return [...nombres];
}

export function verificarLecturas(raiz) {
  const fallos = [];
  const falla = (archivo, mensaje) => fallos.push({ control: 'L10', archivo, mensaje });
  const web = join(raiz, RAIZ_WEB);
  if (!existsSync(web)) return fallos;
  for (const archivo of fuentes(web)) {
    const rel = relative(raiz, archivo).replaceAll('\\', '/');
    const texto = readFileSync(archivo, 'utf8');
    if (rel === INTERACTIVAS) {
      for (const nombre of exportaciones(texto))
        if (!LISTA_CERRADA.includes(nombre))
          falla(rel, `exporta \`${nombre}\`, que no está en la lista cerrada de CP-3`);
    } else if (USE_SERVER.test(texto) && !rel.startsWith(ACCIONES)) {
      falla(rel, "'use server' fuera de servidor/acciones/ y de la lista cerrada de CP-3");
    }
  }
  return fallos;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const fallos = verificarLecturas(process.argv[2] ?? process.cwd());
  for (const f of fallos) console.error(`[L10] ${f.archivo}: ${f.mensaje}`);
  if (fallos.length > 0) process.exit(1);
  console.log('lecturas-interactivas: solo la lista cerrada de CP-3');
}
