// tools/ci/publicar-resultados.mjs — `pnpm ci:integracion` (07 §32.2, DP-33; CH-16). Con M5, `integracion` corre dentro
// del job `rapido`, que produce un solo check. Este script corre la suite y, en CI, publica su resultado como estado de
// commit `integracion`, así `gh pr checks` (y con él `pr:mergear` y la matriz) ve dos resultados, como con dos jobs.
// Uso: node tools/ci/publicar-resultados.mjs <contexto> -- <comando> [args…]
// En CI pide GITHUB_TOKEN con `statuses: write` (solo el job `rapido` lo tiene), GITHUB_REPOSITORY y FINN_SHA (la
// cabeza del PR, no el commit de fusión). Si no puede publicar, sale con 1: un estado ausente se leería "no corrió".
// Fuera de CI solo corre el comando.
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const env = (k) => process.env[k] ?? '';
const [contexto, separador, cmd, ...args] = process.argv.slice(2);
if (!contexto || separador !== '--' || !cmd) {
  console.error('uso: node tools/ci/publicar-resultados.mjs <contexto> -- <comando> [args…]');
  process.exit(2);
}
const enCi = env('CI') !== '';

async function publicar(estado, descripcion) {
  const faltan = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'FINN_SHA'].filter((k) => env(k) === '');
  if (faltan.length) throw new Error(`faltan ${faltan.join(', ')}`);
  const repo = env('GITHUB_REPOSITORY');
  const api = env('GITHUB_API_URL') || 'https://api.github.com';
  const corrida = `${env('GITHUB_SERVER_URL') || 'https://github.com'}/${repo}/actions/runs/${env('GITHUB_RUN_ID')}`;
  const r = await globalThis.fetch(`${api}/repos/${repo}/statuses/${env('FINN_SHA')}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
    body: JSON.stringify({
      state: estado,
      context: contexto,
      description: descripcion,
      target_url: corrida,
    }),
  });
  if (!r.ok) throw new Error(`la API respondió ${r.status}: ${await r.text()}`);
  console.log(`publicar-resultados: ${contexto} = ${estado} en ${env('FINN_SHA').slice(0, 7)}`);
}

async function intentar(estado, descripcion) {
  if (!enCi) return true;
  try {
    await publicar(estado, descripcion);
    return true;
  } catch (e) {
    console.error(`✗ publicar-resultados: no se publicó ${contexto}=${estado}: ${e.message}`);
    return false;
  }
}

if (!(await intentar('pending', `${contexto} en curso (job rapido, M5)`))) process.exit(1);
const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
const codigo = r.status ?? 1;
const estado = codigo === 0 ? 'success' : 'failure';
const publicado = await intentar(
  estado,
  `${contexto}: ${codigo === 0 ? 'verde' : `falló (código ${codigo})`}`,
);
if (env('GITHUB_STEP_SUMMARY') !== '')
  appendFileSync(
    env('GITHUB_STEP_SUMMARY'),
    `- \`${contexto}\`: **${estado}** (estado de commit, M5)\n`,
  );
process.exit(codigo !== 0 ? codigo : publicado ? 0 : 1);
