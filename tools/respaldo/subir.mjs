// Pasos de .github/workflows/respaldo.yml (TA-261; 02 ADR-22; 03 §12.1; 04 §16.2, §16.3): cada subcomando es un paso
// del job y recibe solo sus secretos. `registro.json` lo escribe `subir` como último acto, después de todas las
// subidas, y `registrar` no llama a OPT-09 sin él. El repositorio es público (07 §32.4): toda salida pasa por `ocultar`
// y de C5 y C6 solo se publica el número de filas. Lo que falla termina con código 1: el job falla y GitHub avisa.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { enmascarar } from '../ci/barrera-1b.mjs';
import { consultar } from '../ci/desplegar.mjs';
import { c5, c6 } from '../db/plantilla.ts';

const R2 = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
const API = ['FINN_URL', 'RESPALDO_SECRET'];
export const REQUERIDAS = {
  version: ['RESPALDO_DB_URL'],
  volcar: ['RESPALDO_DB_URL'],
  subir: ['AGE_PUBLIC_KEY', ...R2],
  registrar: API,
  controles: ['RESPALDO_DB_URL', ...API],
};

const correrReal = (cmd, args, entorno) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ...entorno } });
  return {
    status: r.status,
    salida: `${r.stdout ?? ''}${r.stderr ?? ''}${r.error?.message ?? ''}`,
  };
};

export const depsReales = () => ({
  ahora: () => new Date(),
  log: console.log,
  correr: correrReal,
  consultar,
  c5: (url) => c5(url, consultar),
  c6: (url) => c6(url, consultar),
  pedir: globalThis.fetch,
});

/** Las claves sin extensión (ADR-22): la diaria y, el día 1 del mes en UTC, la mensual. */
export function claves(ahora) {
  const dia = ahora.toISOString().slice(0, 10);
  return [`diarios/${dia}`, ...(dia.endsWith('-01') ? [`mensuales/${dia.slice(0, 7)}`] : [])];
}

function exigir(d, cmd, args, entorno) {
  const r = d.correr(cmd, args, entorno);
  if (r.status === 0) return r.salida;
  throw new Error(`${cmd} salió con ${r.status}: ${r.salida}`);
}

const dirDe = (env) => join(env['RUNNER_TEMP'] ?? '.', 'respaldo');

async function postear(env, d, evento, cuerpo) {
  const r = await d.pedir(new URL(`/api/respaldo/${evento}`, env['FINN_URL']).href, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env['RESPALDO_SECRET']}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`POST /api/respaldo/${evento} respondió ${r.status}`);
}

const PASOS = {
  // 04 §16.2: el cliente tiene que ser de la misma versión mayor que el servidor
  version: async (env, d) => {
    const [num] = await d.consultar(env['RESPALDO_DB_URL'], 'SHOW server_version_num');
    const servidor = Math.floor(Number(num) / 10000);
    const salida = exigir(d, 'pg_dump', ['--version']);
    const cliente = Number(/PostgreSQL\)\s+(\d+)/.exec(salida)?.[1]);
    if (servidor !== cliente) throw new Error(`versión: servidor ${servidor}, pg_dump ${cliente}`);
    d.log(`versión mayor ${servidor}`);
  },

  volcar: (env, d) => {
    const dir = dirDe(env);
    mkdirSync(dir, { recursive: true });
    const script = join(dirname(fileURLToPath(import.meta.url)), 'respaldar.mjs');
    exigir(d, process.execPath, [script, env['RESPALDO_DB_URL'], join(dir, 'finn.dump')]);
    d.log('volcado y manifiesto listos');
  },

  // 04 §16.3, pasos 2 y 3. La retención la aplican las reglas de ciclo de vida de R2.
  subir: (env, d) => {
    const dir = dirDe(env);
    const volcado = join(dir, 'finn.dump');
    const manifiesto = `${volcado}.manifiesto.json`;
    const { revision } = JSON.parse(readFileSync(manifiesto, 'utf8'));
    const partes = [
      [volcado, join(dir, 'finn.dump.age'), 'dump.age'],
      [manifiesto, join(dir, 'finn.manifiesto.json.age'), 'manifiesto.json.age'],
    ];
    for (const [claro, cifrado] of partes) {
      exigir(d, 'age', ['-r', env['AGE_PUBLIC_KEY'], '-o', cifrado, claro]);
      rmSync(claro);
    }
    const aws = {
      AWS_ACCESS_KEY_ID: env['R2_ACCESS_KEY_ID'],
      AWS_SECRET_ACCESS_KEY: env['R2_SECRET_ACCESS_KEY'],
      AWS_DEFAULT_REGION: 'auto',
      // R2 no acepta todas las sumas que la CLI manda por defecto
      AWS_REQUEST_CHECKSUM_CALCULATION: 'when_required',
      AWS_RESPONSE_CHECKSUM_VALIDATION: 'when_required',
    };
    const endpoint = `https://${env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com`;
    const bases = claves(d.ahora());
    for (const base of bases)
      for (const [, cifrado, sufijo] of partes) {
        const destino = `s3://${env['R2_BUCKET']}/${base}.${sufijo}`;
        const args = ['s3', 'cp', cifrado, destino, '--endpoint-url', endpoint];
        exigir(d, 'aws', [...args, '--only-show-errors'], aws);
      }
    const objeto = `${bases[0]}.dump.age`;
    const bytes = statSync(partes[0][1]).size;
    writeFileSync(join(dir, 'registro.json'), JSON.stringify({ objeto, revision, bytes }));
    d.log(`subido ${bases.join(' y ')}`);
  },

  // 04 §16.3, paso 4 (OPT-09)
  registrar: async (env, d) => {
    const registro = JSON.parse(readFileSync(join(dirDe(env), 'registro.json'), 'utf8'));
    await postear(env, d, 'respaldo', registro);
    d.log('respaldo registrado');
  },

  // 04 §16.3, paso 5. R15 viaja dentro de C5, como en `desplegar`. La deriva se registra sin contenido y el job falla.
  controles: async (env, d) => {
    const filasC5 = (await d.c5(env['RESPALDO_DB_URL'])).length;
    const filasC6 = (await d.c6(env['RESPALDO_DB_URL'])).length;
    d.log(`C5 y R15: ${filasC5} filas; C6: ${filasC6} filas`);
    if (filasC5 > 0) await postear(env, d, 'deriva', { control: 'C5', filas: filasC5 });
    if (filasC6 > 0) await postear(env, d, 'deriva', { control: 'C6', filas: filasC6 });
    if (filasC5 + filasC6 > 0) throw new Error('C5 o C6 con filas; deriva registrada');
  },
};

function ocultar(texto, env) {
  let t = enmascarar(texto, env);
  for (const v of [...R2, 'RESPALDO_SECRET']) if (env[v]) t = t.split(env[v]).join('[oculto]');
  return t;
}

/** Devuelve el código de salida del subcomando; ningún error sale sin enmascarar. */
export async function ejecutar(sub, env, d = depsReales()) {
  const avisar = (l) => d.log(ocultar(l, env));
  if (!Object.hasOwn(PASOS, sub)) {
    avisar(`subir: subcomando desconocido ${sub}`);
    return 1;
  }
  const faltan = REQUERIDAS[sub].filter((v) => !env[v]);
  if (faltan.length > 0) {
    avisar(`subir ${sub}: faltan ${faltan.join(', ')} (TU-11, TU-12)`);
    return 1;
  }
  try {
    await PASOS[sub](env, { ...d, log: avisar });
    return 0;
  } catch (e) {
    avisar(`subir ${sub}: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await ejecutar(process.argv[2] ?? '', process.env);
}
