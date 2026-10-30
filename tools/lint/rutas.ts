// FE-03 y FE-59 como regla de lint (TA-200; 05 §1.3, §15.5): las rutas de `apps/web/src/app/(finn)/` y las
// carpetas de `apps/web/src/flujos/` salen del árbol de 05 §1.3. Una página que no está en el árbol, o una carpeta de
// flujo que no se deriva de una ruta [L] o [C], falla: cada ruta la crea su tarea dueña (DT-23), no se inventa.
// Uso: node tools/lint/rutas.ts [raíz]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** FE-59: segmentos sin ids; si la ruta termina en un parámetro, se agrega su nombre sin «Id». */
export function carpetaDeFlujo(ruta: string): string {
  const segmentos = ruta.split('/').filter(Boolean);
  return segmentos
    .flatMap((s, i) => {
      const param = /^\[(\w+)\]$/.exec(s);
      if (!param) return [s];
      return i === segmentos.length - 1 ? [kebab((param[1] ?? '').replace(/Id$/, ''))] : [];
    })
    .join('-');
}

/** Las rutas del bloque de 05 §1.3: `{ ruta, clase }`, con la ruta sin `/page.tsx` ni barra final. */
export function rutasDelArbol(markdown: string): { ruta: string; clase: string }[] {
  const desde = markdown.indexOf('### 1.3 Árbol de rutas');
  const bloque = /```\n([\s\S]*?)```/.exec(markdown.slice(desde))?.[1] ?? '';
  const rutas: { ruta: string; clase: string }[] = [];
  for (const linea of bloque.split('\n')) {
    const clase = /\[([PSDLC])\]/.exec(linea)?.[1] ?? '';
    for (const trozo of linea.trim().split(/\s{2,}/)) {
      const palabra = trozo.split(' ')[0] ?? '';
      if (!/^[a-z][\w\-[\]/.]*$/.test(palabra) || !palabra.includes('/')) continue;
      rutas.push({ ruta: palabra.replace(/(^|\/)page\.tsx$/, '').replace(/\/$/, ''), clase });
    }
  }
  // `(finn)/page.tsx` (la ruta `/`) abre el bloque en una línea sin barra
  return [{ ruta: '', clase: 'P' }, ...rutas];
}

const TOP = new Set(['(finn)', 'ingresar', 'sin-conexion', 'api', 'serwist']);
const ARCHIVOS_TOP =
  /^(layout|manifest|not-found|global-error|error|icon|apple-icon|favicon)\.|^globals\.css$/;
const PAGINA = /^(page\.tsx|route\.ts)$/;

function* paginas(dir: string, prefijo: string[] = []): Generator<string[]> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) yield* paginas(join(dir, e.name), [...prefijo, e.name]);
    else if (PAGINA.test(e.name)) yield prefijo;
  }
}

export function verificarRutas(raiz: string): string[] {
  const fallos: string[] = [];
  const arbol = rutasDelArbol(readFileSync(join(raiz, 'docs', '05-frontend.md'), 'utf8'));
  const rutas = new Set(arbol.map((r) => r.ruta));
  const app = join(raiz, 'apps', 'web', 'src', 'app');
  if (existsSync(app)) {
    for (const e of readdirSync(app, { withFileTypes: true })) {
      if (e.isDirectory() ? !TOP.has(e.name) : !ARCHIVOS_TOP.test(e.name))
        fallos.push(`apps/web/src/app/${e.name}: no está en 05 §1.2`);
    }
    const finn = join(app, '(finn)');
    if (existsSync(finn))
      for (const segmentos of paginas(finn)) {
        if (segmentos.some((s) => s === '[...todo]')) continue;
        const ruta = segmentos
          .filter((s) => s !== '@superpuesto')
          .map((s) => s.replace(/^\(\.\)/, ''))
          .join('/');
        if (!rutas.has(ruta))
          fallos.push(
            `apps/web/src/app/(finn)/${segmentos.join('/')}: la ruta «${ruta}» no está en 05 §1.3`,
          );
      }
  }
  const flujos = join(raiz, 'apps', 'web', 'src', 'flujos');
  const nombres = new Map<string, string>();
  for (const { ruta, clase } of arbol) {
    if (clase !== 'L' && clase !== 'C') continue;
    const carpeta = carpetaDeFlujo(ruta);
    if (nombres.has(carpeta))
      fallos.push(`FE-59: «${nombres.get(carpeta)}» y «${ruta}» dan la misma carpeta «${carpeta}»`);
    nombres.set(carpeta, ruta);
  }
  if (existsSync(flujos))
    for (const e of readdirSync(flujos, { withFileTypes: true }))
      if (e.isDirectory() && !nombres.has(e.name))
        fallos.push(
          `apps/web/src/flujos/${e.name}: no se deriva de ninguna ruta [L] o [C] (FE-59)`,
        );
  return fallos;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const fallos = verificarRutas(process.argv[2] ?? process.cwd());
  for (const f of fallos) console.error(f);
  if (fallos.length > 0) process.exit(1);
  console.log('Rutas y flujos: coinciden con 05 §1.3 y §15.5');
}
