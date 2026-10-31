// tools/pruebas/listar.ts — `pnpm pruebas:listar` (07 §2.1, §13.2): une `vitest list --json` y
// `playwright test --list --reporter=json` en pruebas/inventario.json, sin ejecutar ninguna prueba.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

export interface PruebaListada {
  titulo: string;
  archivo: string;
}

const normal = (p: string): string => p.replaceAll('\\', '/');

/** `vitest list --json`: [{ name, file }]; el nombre trae los describe unidos con " > ". */
export function deVitest(json: string, raiz: string): PruebaListada[] {
  const r = normal(raiz).replace(/\/?$/, '/');
  return (JSON.parse(json) as { name: string; file: string }[]).map((t) => {
    const a = normal(t.file);
    return { titulo: t.name, archivo: a.startsWith(r) ? a.slice(r.length) : a };
  });
}

interface Suite {
  specs?: { title: string; file: string }[];
  suites?: Suite[];
}

/** `playwright test --list --reporter=json`: suites anidadas; los archivos son relativos a `testDir`. */
export function dePlaywright(json: string, dirE2E = 'apps/web/e2e/'): PruebaListada[] {
  const recorrer = (s: Suite): PruebaListada[] => [
    ...(s.specs ?? []).map((sp) => ({ titulo: sp.title, archivo: dirE2E + normal(sp.file) })),
    ...(s.suites ?? []).flatMap(recorrer),
  ];
  return ((JSON.parse(json) as { suites?: Suite[] }).suites ?? []).flatMap(recorrer);
}

/** Una prueba de Playwright aparece una vez por proyecto: el inventario la lista una vez. */
export function sinRepetir(xs: PruebaListada[]): PruebaListada[] {
  const k = (x: PruebaListada): string => `${x.archivo}\u0000${x.titulo}`;
  return xs.filter((x, i) => xs.findIndex((y) => k(y) === k(x)) === i);
}

const ejecutar = (comando: string, cwd: string) =>
  spawnSync(comando, { cwd, encoding: 'utf8', shell: true, maxBuffer: 256 * 1024 * 1024 });
// La salida puede traer líneas de aviso antes del JSON
const soloJson = (s: string): string => {
  const i = s.search(/[[{]/);
  return i < 0 ? '' : s.slice(i);
};

/**
 * El JSON de `vitest list --json`, o un error con su stdout y su stderr. Salir con 0 no basta: si el proyecto
 * `componentes` no puede abrir Chromium, Vitest registra errores sin manejar, sale con 0 y no imprime la lista.
 */
export function listaDeVitest(s: {
  status: number | null;
  stdout: string;
  stderr: string;
}): string {
  const falla = (motivo: string): Error =>
    new Error(
      `vitest list ${motivo} (¿falta Chromium? pnpm exec playwright install chromium)\n` +
        `--- stdout ---\n${s.stdout}\n--- stderr ---\n${s.stderr}`,
    );
  if (s.status !== 0) throw falla(`terminó con ${s.status}`);
  if (/unhandled errors/i.test(s.stderr)) throw falla('tuvo errores sin manejar al recolectar');
  const json = soloJson(s.stdout);
  let lista: unknown;
  try {
    lista = JSON.parse(json);
  } catch {
    throw falla('no dio JSON');
  }
  if (!Array.isArray(lista)) throw falla('no dio JSON con una lista');
  return json;
}

if (import.meta.main) {
  const raiz = process.cwd();
  const vitest = ejecutar('pnpm exec vitest list --json --silent --coverage.enabled=false', raiz);
  const listaVitest = listaDeVitest(vitest);
  // Sin pruebas, `playwright --list` sale con 1 y "No tests found": es una lista vacía, no un fallo.
  const pw = ejecutar('pnpm exec playwright test --list --reporter=json', `${raiz}/apps/web`);
  const inventario = sinRepetir([
    ...deVitest(listaVitest, raiz),
    ...(/^\s*\{/.test(pw.stdout) ? dePlaywright(soloJson(pw.stdout)) : []),
  ]).sort((x, y) => x.archivo.localeCompare(y.archivo) || x.titulo.localeCompare(y.titulo));
  mkdirSync('pruebas', { recursive: true });
  writeFileSync('pruebas/inventario.json', JSON.stringify(inventario, null, 1) + '\n');
  console.log(`${inventario.length} pruebas en pruebas/inventario.json`);
}
