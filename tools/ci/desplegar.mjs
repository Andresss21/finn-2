// Job `desplegar` de ci.yml (TA-260; 02 ADR-10, 03 §11.7, 07 §6.1, CH-02, CH-64). `ci:politica-patrones` corre antes,
// en su propio paso y sin secretos. Aquí, en orden: migraciones como finn_migraciones; C5 (con R15) y C6 como
// finn_respaldo; barrera 1b; `vercel deploy --prod`; etiqueta del commit desplegado (04 §16.3, paso 5).
// Lo que falla corta: si C5 o C6 fallan, no se despliega, el job falla y GitHub envía el correo (CH-02). No hay guardia
// que saltee el despliegue por falta de secretos: faltan y el job falla. El repositorio es público: toda salida pasa
// por `enmascarar` y de C5 y C6 solo se publica el número de filas.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { c3, c5, c6 } from '../db/plantilla.ts';
import { comprobar, correrVercel, enmascarar, listarConVercel } from './barrera-1b.mjs';

export const REQUERIDAS = [
  'DIRECT_URL',
  'RESPALDO_DB_URL',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'GITHUB_TOKEN',
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'GITHUB_RUN_NUMBER',
  'GITHUB_RUN_ATTEMPT',
];

/** Como `consultar` del arnés: filas como psql `-A -t`. */
async function consultar(url, sql) {
  const pg = createRequire(new URL('../../packages/db/package.json', import.meta.url))('pg');
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const r = await c.query({ text: sql, rowMode: 'array' });
    return (Array.isArray(r) ? r : [r]).flatMap((x) =>
      x.rows.map((f) => f.map((v) => (v === null ? '' : String(v))).join('|')),
    );
  } finally {
    await c.end();
  }
}

/** Etiqueta inmutable; la del despliegue vigente es la mayor con `git tag --sort=-v:refname 'desplegado-*'`. */
export const nombreEtiqueta = (env) =>
  `desplegado-${env['GITHUB_RUN_NUMBER']}-${env['GITHUB_RUN_ATTEMPT']}`;

/** Los pasos reales. `correr` y `pedir` se inyectan: ninguna prueba toca Vercel, GitHub ni la base. */
export const pasosReales = (
  env,
  correr = correrVercel,
  pedir = globalThis.fetch,
  log = console.log,
) => ({
  migrar: () => c3(env['DIRECT_URL'], consultar),
  c5: () => c5(env['RESPALDO_DB_URL'], consultar),
  c6: () => c6(env['RESPALDO_DB_URL'], consultar),
  barrera: () => comprobar(listarConVercel(env, correr), env),
  vercelDeploy: () => {
    const r = correr(['deploy', '--prod', '--yes', '--token', env['VERCEL_TOKEN'] ?? ''], env);
    log(enmascarar(r.salida, env));
    if (r.status !== 0) throw new Error(`vercel deploy salió con ${r.status}`);
  },
  etiquetar: async () => {
    const r = await pedir(`https://api.github.com/repos/${env['GITHUB_REPOSITORY']}/git/refs`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env['GITHUB_TOKEN']}`,
        accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({ ref: `refs/tags/${nombreEtiqueta(env)}`, sha: env['GITHUB_SHA'] }),
    });
    if (!r.ok) throw new Error(`crear la etiqueta respondió ${r.status}`);
    log(`etiqueta ${nombreEtiqueta(env)}`);
  },
});

/** Devuelve el código de salida. Una excepción de un paso también corta: la atrapa `principal`. */
export async function desplegar(env, pasos, log = console.log) {
  const faltan = REQUERIDAS.filter((v) => !env[v]);
  if (faltan.length > 0) {
    log(`desplegar: faltan ${faltan.join(', ')} (TU-09, TU-12)`);
    return 1;
  }
  await pasos.migrar();
  log('migraciones: aplicadas');
  const filasC5 = (await pasos.c5()).length;
  const filasC6 = (await pasos.c6()).length;
  log(`C5 y R15: ${filasC5} filas; C6: ${filasC6} filas`);
  if (filasC5 + filasC6 > 0) {
    log('desplegar: C5 o C6 fallaron después de migrar; no se despliega (03 §11.7, CH-64)');
    return 1;
  }
  const fallos = pasos.barrera();
  for (const f of fallos) log(`barrera 1b: ${f}`);
  if (fallos.length > 0) return 1;
  log('barrera 1b: PASA');
  pasos.vercelDeploy();
  await pasos.etiquetar();
  return 0;
}

/** Punto de entrada: ningún error sale sin enmascarar. */
export async function principal(env, pasos, log = console.log) {
  const avisar = (l) => log(enmascarar(l, env));
  try {
    return await desplegar(env, pasos, avisar);
  } catch (e) {
    avisar(`desplegar: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.on('uncaughtException', (e) => {
    console.error(enmascarar(`desplegar: ${e?.message ?? e}`));
    process.exit(1);
  });
  process.exitCode = await principal(process.env, pasosReales(process.env));
}
