// M4 sin token personal (P7-14): proyecta los minutos del mes sumando la duración de cada job, redondeada hacia arriba
// al minuto (peor caso de 6.4), con la API de workflow runs y el GITHUB_TOKEN del propio job (`permissions: actions: read`).
// El modo resultante se guarda en la caché de Actions (clave ci-modo-AAAAMM-<run_id>); los workflows lo restauran por prefijo.
//   node tools/ci/minutos.ts proyectar           (en el nocturno; usa GITHUB_REPOSITORY y GITHUB_TOKEN)
//   node tools/ci/minutos.ts prueba <fixture>    (sin red: calcula sobre un JSON de ejemplo)
export interface Job { started_at: string | null; completed_at: string | null; runner_name?: string | null; labels?: string[] }
export const minutosCobrados = (jobs: Job[]) => jobs.reduce((s, j) => {
  if (!j.started_at || !j.completed_at) return s;
  if (j.labels?.includes('self-hosted')) return s;                   // no hay runners propios (M6 descartado), pero no se cobran
  return s + Math.ceil((Date.parse(j.completed_at) - Date.parse(j.started_at)) / 60000);
}, 0);
export function proyectar(usados: number, hoy: Date) {
  const dia = hoy.getUTCDate(), diasMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0)).getUTCDate();
  const proyeccion = Math.round(usados * diasMes / dia);
  return { usados, proyeccion, modo: proyeccion > 1700 ? 'ahorro' : 'normal' as const };
}
async function api(ruta: string) {
  const r = await fetch(`https://api.github.com${ruta}`, { headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`); return r.json();
}
if (import.meta.main) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'prueba') {
    const { runs, hoy } = JSON.parse((await import('node:fs')).readFileSync(arg, 'utf8'));
    console.log(JSON.stringify(proyectar(runs.reduce((s: number, r: { jobs: Job[] }) => s + minutosCobrados(r.jobs), 0), new Date(hoy))));
  }
  if (cmd === 'proyectar') {
    const repo = process.env.GITHUB_REPOSITORY, hoy = new Date(), desde = hoy.toISOString().slice(0, 8) + '01';
    let usados = 0;
    for (let p = 1; ; p++) {
      const { workflow_runs } = await api(`/repos/${repo}/actions/runs?created=%3E%3D${desde}&per_page=100&page=${p}`);
      for (const run of workflow_runs) { const { jobs } = await api(`/repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`); usados += minutosCobrados(jobs); }
      if (workflow_runs.length < 100) break;
    }
    const r = proyectar(usados, hoy); console.log(JSON.stringify(r));
    (await import('node:fs')).writeFileSync('ci-modo.json', JSON.stringify({ ...r, calculadoEn: hoy.toISOString() }));
  }
}
