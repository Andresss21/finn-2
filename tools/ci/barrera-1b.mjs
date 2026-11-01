// Barrera 1b (07 §4.3, CT-01; 04 §14.1): ninguna variable del reloj de prueba existe en Vercel. `desplegar` la corre
// antes de `vercel deploy --prod` y es el mismo script del despliegue de emergencia (07 §31.5, paso 7).
// El repositorio es público y `vercel env ls` muestra los valores que no son secretos: su listado nunca se imprime,
// solo los nombres prohibidos que encontró. Falla cerrada: sin un listado reconocible no se afirma nada.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const VARIABLES = ['FINN_ENTORNO', 'FINN_RELOJ_ARCHIVO', 'FINN_HOY_SIMULADO'];
export const ENTORNOS = ['production', 'preview', 'development'];

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const LISTADO = /(^|\s)(No )?Environment Variables found for /m;
const SECRETOS = ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID', 'GITHUB_TOKEN'];
const URLS = ['DIRECT_URL', 'RESPALDO_DB_URL'];

/** Host, usuario (con la referencia del proyecto) y clave de una URL de base, además de la URL entera. */
function partesDeUrl(valor) {
  try {
    const u = new URL(valor);
    const usuario = decodeURIComponent(u.username);
    return [valor, u.hostname, u.password, usuario, ...usuario.split('.')];
  } catch {
    return [valor];
  }
}

/** Tapa host, URL, IP, identificadores y credenciales en lo que va a un log público. */
export function enmascarar(texto, env = process.env) {
  const literales = [
    ...URLS.flatMap((v) => (env[v] ? partesDeUrl(env[v]) : [])),
    ...SECRETOS.map((v) => env[v] ?? ''),
  ]
    .filter((l) => l !== '')
    .sort((a, b) => b.length - a.length);
  let t = String(texto);
  for (const l of literales) t = t.split(l).join('[oculto]');
  return t
    .replace(/\b(postgres(ql)?|https?):\/\/\S+/gi, '[url]')
    .replace(/\b[\w.-]+\.(vercel\.(app|com)|supabase\.(com|co))\b(:\d+)?/gi, '[host]')
    .replace(/\b\d{1,3}(\.\d{1,3}){3}\b(:\d+)?/g, '[ip]')
    .replace(/\b[0-9a-f]{1,4}(:[0-9a-f]{0,4}){3,}/gi, '[ip]');
}

/** La CLI de Vercel fijada en package.json, sin shell ni `pnpm dlx`. */
export function correrVercel(args, env = process.env) {
  const req = createRequire(join(raiz, 'package.json'));
  const cli = join(dirname(req.resolve('vercel/package.json')), 'dist', 'vc.js');
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: raiz,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/** Las variables prohibidas nombradas en una salida de `vercel env ls`. */
export const variablesEn = (salida) =>
  VARIABLES.filter((v) => new RegExp(`(^|[^A-Z0-9_])${v}($|[^A-Z0-9_])`, 'm').test(salida));

/** Lista los tres entornos con `listar(entorno)`; devuelve los fallos, sin contenido del listado. */
export function comprobar(listar, env = process.env) {
  return ENTORNOS.flatMap((entorno) => {
    const { status, salida } = listar(entorno);
    if (status !== 0)
      return [`vercel env ls ${entorno} salió con ${status}: ${enmascarar(salida, env)}`];
    if (!LISTADO.test(salida)) return [`vercel env ls ${entorno}: salida no reconocida`];
    return variablesEn(salida).map((v) => `${v} existe en ${entorno}`);
  });
}

/** `vercel env ls <entorno>` con el token del entorno de la ejecución. */
export const listarConVercel =
  (env, correr = correrVercel) =>
  (entorno) =>
    correr(['env', 'ls', entorno, '--token', env['VERCEL_TOKEN'] ?? ''], env);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fallos = comprobar(listarConVercel(process.env));
  for (const f of fallos) console.error(`barrera 1b: ${f}`);
  console.log(fallos.length === 0 ? 'barrera 1b: PASA' : 'barrera 1b: FALLA');
  process.exitCode = fallos.length === 0 ? 0 : 1;
}
