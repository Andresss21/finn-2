// tools/pruebas/inestables.mjs — aviso y cuarentena de pruebas inestables (TA-013; 07 §7.2, §7.3; DP-11).
//   node tools/pruebas/inestables.mjs <informe.json de Playwright>
// 1. Aviso: por cada prueba `flaky` abre o actualiza el issue con la etiqueta `prueba-inestable` de su identificador,
//    con la traza y la corrida (GITHUB_TOKEN del job con `issues: write`, GITHUB_REPOSITORY, GITHUB_RUN_ID).
// 2. Cuarentena: con 2 inestabilidades en 7 días agrega { id, motivo, desde, vence = desde + 14 días } a
//    pruebas/cuarentena.json y lo deja dicho en el issue. Una entrada vencida la hace fallar la matriz en `rapido` (M9).
// Sin GITHUB_TOKEN (en local, sin reintentos) solo lista las inestables. Las funciones exportadas reciben `hoy`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DIA = 86_400_000;
const ETIQUETA = 'prueba-inestable';
const MARCA = /inestable el (\d{4}-\d{2}-\d{2})/g;

/** Las pruebas `flaky` del informe JSON de Playwright, con su identificador (07 §2.1) y la traza si existe. */
export function flaky(informe) {
  const salida = [];
  const recorrer = (suite) => {
    for (const spec of suite.specs ?? [])
      for (const t of spec.tests ?? []) {
        if (t.status !== 'flaky') continue;
        const traza = (t.results ?? [])
          .flatMap((r) => r.attachments ?? [])
          .find((a) => a.name === 'trace')?.path;
        const id = /^(PRU-[A-Z0-9]+-[A-Z0-9]+-\d{3})\b/.exec(spec.title)?.[1] ?? spec.title;
        salida.push({
          id,
          titulo: spec.title,
          proyecto: t.projectName ?? '',
          traza: traza ?? null,
        });
      }
    for (const s of suite.suites ?? []) recorrer(s);
  };
  for (const s of informe.suites ?? []) recorrer(s);
  return salida;
}

/** Las fechas de inestabilidad que registró el issue (cuerpo y comentarios). */
export const fechas = (textos) =>
  textos.flatMap((t) => [...(t ?? '').matchAll(MARCA)].map((m) => m[1]));

/** 2 inestabilidades en 7 días (contando la de hoy): la entrada nueva, o null si no corresponde o ya está. */
export function aCuarentena(cuarentena, id, historial, hoy) {
  const dia = hoy.toISOString().slice(0, 10);
  const recientes = historial.filter((f) => hoy.getTime() - Date.parse(f) < 7 * DIA);
  if (recientes.length < 2 || cuarentena.some((q) => q.id === id)) return null;
  const vence = new Date(Date.parse(dia) + 14 * DIA).toISOString().slice(0, 10);
  return {
    id,
    motivo: `inestable ${recientes.length} veces en 7 días (07 §7.3)`,
    desde: dia,
    vence,
  };
}

async function api(ruta, metodo = 'GET', cuerpo = undefined) {
  const r = await globalThis.fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${ruta}`,
    {
      method: metodo,
      headers: {
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    },
  );
  if (!r.ok) throw new Error(`inestables: ${metodo} ${ruta} respondió ${r.status}`);
  return r.json();
}

/** Abre o comenta el issue de la prueba y devuelve su historial, con la inestabilidad de hoy al final. */
async function avisar(p, hoy) {
  const corrida = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const linea = `- ${p.id} inestable el ${hoy.toISOString().slice(0, 10)} (${p.proyecto}): corrida ${corrida}; traza ${p.traza ?? 'sin traza'}`;
  const abiertos = await api(`/issues?labels=${ETIQUETA}&state=open&per_page=100`);
  const issue = abiertos.find((i) => i.title === `${p.id} inestable`);
  if (!issue) {
    const nuevo = await api('/issues', 'POST', {
      title: `${p.id} inestable`,
      labels: [ETIQUETA],
      body: `${p.titulo}\n\n${linea}`,
    });
    return { numero: nuevo.number, historial: fechas([linea]) };
  }
  const comentarios = await api(`/issues/${issue.number}/comments?per_page=100`);
  await api(`/issues/${issue.number}/comments`, 'POST', { body: linea });
  return {
    numero: issue.number,
    historial: fechas([issue.body, ...comentarios.map((c) => c.body), linea]),
  };
}

if (import.meta.main) {
  const [ruta] = process.argv.slice(2);
  if (!ruta || !existsSync(ruta)) {
    console.error(`inestables: falta el informe de Playwright (${ruta ?? 'sin ruta'})`);
    process.exit(2);
  }
  const lista = flaky(JSON.parse(readFileSync(ruta, 'utf8')));
  const hoy = new Date();
  for (const p of lista) console.log(`::warning::prueba inestable ${p.id} (${p.proyecto})`);
  if (lista.length && process.env.GITHUB_TOKEN) {
    const archivo = 'pruebas/cuarentena.json';
    const cuarentena = JSON.parse(readFileSync(archivo, 'utf8'));
    for (const p of lista) {
      const { numero, historial } = await avisar(p, hoy);
      const entrada = aCuarentena(cuarentena, p.id, historial, hoy);
      if (!entrada) continue;
      cuarentena.push(entrada);
      // El runner no hace commits: el issue lleva la entrada para el PR que la agrega o corrige la prueba
      const texto = `Cuarentena (07 §7.3): agregar a ${archivo}:\n\n\`\`\`json\n${JSON.stringify(entrada)}\n\`\`\``;
      await api(`/issues/${numero}/comments`, 'POST', { body: texto });
      console.log(`::warning::${p.id} entra en cuarentena hasta el ${entrada.vence}`);
    }
    writeFileSync(archivo, `${JSON.stringify(cuarentena, null, 2)}\n`);
  }
}
